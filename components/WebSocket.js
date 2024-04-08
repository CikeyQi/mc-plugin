import { WebSocketServer } from 'ws';
import Config from './Config.js';
import Init from '../model/init.js';
import sendMsg from './SendMsg.js';

class WebSocket {
    constructor() {
        this.initWebSocket();
        this.connections = {}
    }

    async initWebSocket() {
        try {
            let config = await Config.getConfig();

            Init.initConfig();

            const wss = new WebSocketServer({
                port: config.mc_qq_ws_port,
                path: config.mc_qq_ws_url,
            });

            wss.on('listening', () => {
                logger.mark(
                    logger.blue('[Minecraft WebSocket]') +
                    ' 连接地址：' +
                    logger.green(`ws://localhost:${config.mc_qq_ws_port}${config.mc_qq_ws_url}`)
                );
            });

            wss.on('connection', (ws, request) => {
                const serverName = JSON.parse(`"${request.headers['x-self-name']}"`);
                if (this.connections[serverName]) {
                    ws.close(1000, 'Duplicate connection');
                    logger.mark(
                        logger.blue('[Minecraft WebSocket] ') +
                        logger.green(serverName) +
                        ' 尝试连接至 WebSocket 服务器，但出现同名服务器，已拒绝连接'
                    )
                }
                logger.mark(
                    logger.blue('[Minecraft WebSocket] ') +
                    logger.green(serverName) +
                    ' 已连接至 WebSocket 服务器'
                );
                this.connections[serverName] = ws;

                ws.on('message', (message) => {
                    if (config.debug_mode) {
                        logger.mark(
                            logger.blue('[Minecraft WebSocket] ') +
                            logger.green(serverName) +
                            ' 收到消息：' + message
                        );
                    }
                    sendMsg(message)
                });

                ws.on('close', () => {
                    logger.mark(
                        logger.blue('[Minecraft WebSocket] ') +
                        logger.yellow(serverName) +
                        ' 已断开与 WebSocket 服务器的连接'
                    );

                    delete this.connections[serverName];
                });
            });

        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}

export default new WebSocket();