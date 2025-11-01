import { WebSocketServer, WebSocket } from 'ws';
import Config from './Config.js';
import processAndSend from './SendMsg.js';
import { handleResponse } from '../apps/Response.js';

const WS_LOG_PREFIX = logger.blue('[Minecraft WebSocket] ');

class WebSocketManager {

    constructor() {
        this.activeSockets = {};
        this._initializeAsync();
    }

    async _initializeAsync() {
        try {
            const config = await Config.getConfig();
            if (!config) {
                logger.error(WS_LOG_PREFIX + '无法获取配置，WebSocket服务无法启动');
                return;
            }

            if (config.mc_qq_ws_server) {
                this._startLocalServer(config);
            }

            this._connectToRemoteServers(config);

        } catch (error) {
            logger.error(WS_LOG_PREFIX + `初始化失败: ${error.message}`);
        }
    }

    _startLocalServer(config) {
        const { mc_qq_ws_port: wsPort, mc_qq_ws_url: wsPath, mc_qq_ws_password: wsPassword, debug_mode: debugMode } = config;

        if (!wsPort || !wsPath) {
            logger.error(WS_LOG_PREFIX + 'WebSocket服务器端口或路径未配置，无法启动');
            return;
        }

        const wss = new WebSocketServer({ port: wsPort, path: wsPath });

        wss.on('listening', () => {
            logger.mark(
                WS_LOG_PREFIX +
                '监听地址：' +
                logger.green(`ws://localhost:${wsPort}${wsPath}`)
            );
        });

        wss.on('connection', (ws, request) => {
            let remoteName
            try {
                remoteName = decodeURIComponent(request.headers['x-self-name']);
                let authToken = decodeURIComponent(request.headers['authorization']);
                authToken = authToken.replace(/^Bearer\s*/i, '');

                if (!remoteName) {
                    ws.close(1008, 'Invalid remote name');
                    return;
                }

                if (wsPassword && authToken !== wsPassword) {
                    ws.close(1008, 'Invalid token');
                    logger.mark(
                        WS_LOG_PREFIX +
                        logger.yellow(remoteName) +
                        ' 尝试连接，但令牌无效，已拒绝'
                    );
                    return;
                }

                if (this.activeSockets[remoteName]) {
                    ws.close(1000, 'Duplicate connection');
                    logger.mark(
                        WS_LOG_PREFIX +
                        logger.yellow(remoteName) +
                        ' 尝试连接，但已存在同名连接，已拒绝'
                    );
                    return;
                }

                logger.mark(WS_LOG_PREFIX + logger.green(remoteName) + ' 已连接');
                this.activeSockets[remoteName] = ws;

                ws.on('message', (message) => {
                    if (debugMode) {
                        logger.mark(
                            WS_LOG_PREFIX +
                            logger.green(remoteName) +
                            ' 收到消息：' + message
                        );
                    }
                    let msgObj;
                    try {
                        msgObj = JSON.parse(message.toString());
                    } catch (err) {
                        logger.error(WS_LOG_PREFIX + '消息解析失败: ' + err.message + '，内容: ' + message);
                        return;
                    }
                    if (msgObj.post_type === 'response' && msgObj.echo) {
                        handleResponse(msgObj.echo, msgObj);
                    } else {
                        processAndSend(message.toString());
                    }
                });

                ws.on('close', (code, reason) => {
                    logger.mark(
                        WS_LOG_PREFIX +
                        logger.yellow(remoteName) +
                        ` 已断开 Code: ${code}, Reason: ${reason || 'N/A'}`
                    );
                    delete this.activeSockets[remoteName];
                });

                ws.on('error', (error) => {
                    logger.error(
                        WS_LOG_PREFIX +
                        logger.red(remoteName) +
                        ` 连接出错 ${error.message}`
                    );
                    delete this.activeSockets[remoteName];
                });

            } catch (error) {
                logger.error(WS_LOG_PREFIX + `处理来自 ${remoteName ? logger.red(remoteName) : '未知服务器'} 的新连接时出错: ${error.message}`);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(1011, 'Internal server error');
                }
            }
        });

        wss.on('error', (error) => {
            logger.error(WS_LOG_PREFIX + `本地服务器错误: ${error.message}`);
        });
    }

    _connectToRemoteServers(config) {
        const { mc_qq_server_list: remoteServers, debug_mode: debugMode } = config;

        if (!remoteServers || !Array.isArray(remoteServers)) {
            logger.info(WS_LOG_PREFIX + '未配置远程服务器列表或格式不正确');
            return;
        }

        remoteServers.forEach(serverCfg => {
            if (serverCfg.ws_able && serverCfg.ws_url && serverCfg.server_name) {
                if (this.activeSockets[serverCfg.server_name]) {
                    logger.info(WS_LOG_PREFIX + `已存在到 ${serverCfg.server_name} 的连接，跳过`);
                } else {
                    this._establishClientConnection(serverCfg, debugMode);
                }
            } else if (serverCfg.ws_able) {
                logger.warn(WS_LOG_PREFIX + `远程服务器配置 ${serverCfg.server_name || '未命名'} 不完整，跳过`);
            }
        });
    }

    async _establishClientConnection(serverCfg, globalDebug, retries = 0) {
        const { server_name: serverName, ws_url: serverUrl, ws_password: serverToken, ws_max_attempts: maxRetries = 3 } = serverCfg;

        logger.info(WS_LOG_PREFIX + `尝试连接到 ${serverName} (${serverUrl})... (尝试次数: ${retries + 1})`);

        const headers = {
            'X-Self-Name': encodeURIComponent(serverName),
            'Authorization': serverToken ? `Bearer ${encodeURIComponent(serverToken)}` : undefined
        };
        Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key]);

        const ws = new WebSocket(serverUrl, { headers });

        ws.on('open', () => {
            logger.mark(WS_LOG_PREFIX + logger.green(serverName) + ' 已连接');
            this.activeSockets[serverName] = ws;
        });

        ws.on('message', (message) => {
            if (globalDebug) {
                logger.mark(
                    WS_LOG_PREFIX +
                    logger.green(serverName) +
                    ' 收到消息：' +
                    logger.green(message.toString())
                );
            }
            processAndSend(message.toString());
        });

        ws.on('close', (code, reason) => {
            logger.mark(
                WS_LOG_PREFIX +
                logger.yellow(serverName) +
                ` 连接已断开 Code: ${code}, Reason: ${reason || 'N/A'}`
            );
            delete this.activeSockets[serverName];

            if (retries < maxRetries) {
                logger.info(WS_LOG_PREFIX + `${serverName} 将在5秒后尝试重新连接... (剩余尝试: ${maxRetries - retries})`);
                setTimeout(() => {
                    this._establishClientConnection(serverCfg, globalDebug, retries + 1);
                }, 5000);
            } else {
                logger.error(WS_LOG_PREFIX + logger.red(serverName) + ` 已达到最大重连次数 (${maxRetries + 1})，放弃连接`);
            }
        });

        ws.on('error', (error) => {
            logger.error(
                WS_LOG_PREFIX +
                logger.red(serverName) +
                ` 连接错误 ${error.message}`
            );
            if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
                if (this.activeSockets[serverName]) {
                    delete this.activeSockets[serverName];
                    if (retries < maxRetries) {
                        logger.info(WS_LOG_PREFIX + `${serverName} 因错误将尝试重新连接...`);
                        setTimeout(() => {
                            this._establishClientConnection(serverCfg, globalDebug, retries + 1);
                        }, 5000);
                    } else {
                        logger.error(WS_LOG_PREFIX + logger.red(serverName) + ` 因错误达到最大重连次数，放弃连接`);
                    }
                }
            }
        });
    }
}

export default new WebSocketManager();