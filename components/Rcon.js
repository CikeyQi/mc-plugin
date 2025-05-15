import { Rcon } from 'rcon-client';
import Config from './Config.js';

const RCON_LOG_PREFIX = logger.blue('[Minecraft RCON] ');

class RconManager {

    constructor() {
        this.activeConnections = {};
        this._initializeConnectionsAsync();
    }

    async _initializeConnectionsAsync() {
        try {
            const config = await Config.getConfig();
            if (!config) {
                logger.error(RCON_LOG_PREFIX + '无法获取配置，RCON服务无法启动连接');
                return;
            }

            const { mc_qq_server_list: rconServerList } = config;
            if (!rconServerList || !Array.isArray(rconServerList)) {
                logger.info(RCON_LOG_PREFIX + '未配置RCON服务器列表或格式不正确');
                return;
            }

            rconServerList.forEach(serverCfg => {
                if (serverCfg.rcon_able && serverCfg.rcon_host && serverCfg.rcon_port && serverCfg.rcon_password && serverCfg.server_name) {
                    if (this.activeConnections[serverCfg.server_name]) {
                        logger.info(RCON_LOG_PREFIX + `已存在到 ${serverCfg.server_name} 的RCON连接，跳过`);
                    } else {
                        this._establishConnection(serverCfg);
                    }
                } else if (serverCfg.rcon_able) {
                    logger.warn(RCON_LOG_PREFIX + `RCON服务器配置 ${serverCfg.server_name || '未命名'} 不完整，跳过`);
                }
            });

        } catch (error) {
            logger.error(RCON_LOG_PREFIX + `初始化RCON连接失败: ${error.message}`);
        }
    }

    async _establishConnection(serverCfg, retries = 0) {
        const { server_name: serverName, rcon_host: host, rcon_port: port, rcon_password: password, rcon_max_attempts: maxRetries = 3 } = serverCfg;

        logger.info(RCON_LOG_PREFIX + `尝试连接到 ${serverName} (${host}:${port})... (尝试次数: ${retries + 1})`);

        const rcon = new Rcon({
            host: host,
            port: port,
            password: password,
            timeout: 10000
        });

        try {
            await rcon.connect();
            logger.mark(RCON_LOG_PREFIX + logger.green(serverName) + ' RCON连接成功');
            this.activeConnections[serverName] = rcon;

            rcon.on('end', () => {
                logger.mark(
                    RCON_LOG_PREFIX +
                    logger.yellow(serverName) +
                    ' RCON连接已断开'
                );
                if (this.activeConnections[serverName] === rcon) {
                    delete this.activeConnections[serverName];
                }

                logger.info(RCON_LOG_PREFIX + `${serverName} 将尝试重新连接...`);

                if (serverCfg.rcon_able) {
                    setTimeout(() => this._establishConnection(serverCfg, 0), 5000);
                }

            });

            rcon.on('error', (err) => {
                logger.error(
                    RCON_LOG_PREFIX +
                    logger.red(serverName) +
                    ` RCON连接发生错误: ${err.message}`
                );

                if (this.activeConnections[serverName] === rcon) {
                    delete this.activeConnections[serverName];
                }
                rcon.end();
            });

        } catch (error) {
            logger.mark(
                RCON_LOG_PREFIX +
                logger.red(serverName) +
                ` RCON连接失败: ${error.message}`
            );
            if (this.activeConnections[serverName] === rcon) {
                delete this.activeConnections[serverName];
            }

            if (retries < maxRetries) {
                logger.info(RCON_LOG_PREFIX + `${serverName} 将在5秒后尝试重新连接... (剩余尝试: ${maxRetries - retries})`);
                setTimeout(() => this._establishConnection(serverCfg, retries + 1), 5000);
            } else {
                logger.error(RCON_LOG_PREFIX + logger.red(serverName) + ` RCON连接失败，已达到最大重连次数 (${maxRetries + 1})，请检查RCON服务是否正常运行`);
            }
        }
    }
}

export default new RconManager();