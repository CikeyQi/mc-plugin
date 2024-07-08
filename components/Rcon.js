import { Rcon } from 'rcon-client';
import Config from './Config.js';
import Init from '../model/init.js';

class RconClient {
    constructor() {
        this.servers = {};
        this.initRconClient();
    }

    async initRconClient() {
        try {
            const config = await Config.getConfig();
            Init.initConfig();

            config.mc_qq_server_list.forEach(serverConfig => {
                if (serverConfig.rcon_able && !this.servers[serverConfig.server_name]) {
                    this.connectRcon(serverConfig);
                }
            });
        } catch (error) {
            console.error(`[Minecraft RCON Client] 初始化失败: ${error.message}`);
        }
    }

    async connectRcon(serverConfig, attempts = 0) {
        const rcon = new Rcon({
            host: serverConfig.rcon_host,
            port: serverConfig.rcon_port,
            password: serverConfig.rcon_password
        });

        try {
            await rcon.connect();
            logger.mark(
                logger.blue('[Minecraft RCON Client] ') +
                logger.green(serverConfig.server_name) +
                ' 连接成功'
            )
            this.servers[serverConfig.server_name] = rcon;

            rcon.on('end', () => {
                logger.mark(
                    logger.blue('[Minecraft RCON Client] ') +
                    logger.yellow(serverConfig.server_name) +
                    ' 连接已断开，正在重连...'
                )
                delete this.servers[serverConfig.server_name];
                this.connectRcon(serverConfig, attempts + 1);
            });
        } catch (error) {
            logger.mark(
                logger.blue('[Minecraft RCON Client] ') +
                logger.red(serverConfig.server_name) +
                ' 连接失败: ' + error.message
            )
            if (attempts < serverConfig.rcon_max_attempts) {
                setTimeout(() => this.connectRcon(serverConfig, attempts + 1), 5000);
            } else {
                logger.mark(
                    logger.blue('[Minecraft RCON Client] ') +
                    logger.red(serverConfig.server_name) +
                    ' 连接失败，已达到最大重连次数，请检查 Rcon 是否正常运行'
                )
            }
        }
    }
}

export default new RconClient();