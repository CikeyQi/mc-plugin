import Rcon from 'rcon';
import Config from './Config.js';
import Init from '../model/init.js';
import Log from '../utils/logs.js';

let RconClient = null;

class RconConnect {
    constructor() {
        this.RconInit();
    }

    async sendCommand(e, command) {
        if (!RconClient) {
            await RconInit();
            if (!RconClient) {
                e.reply('[MC_QQ]丨Rcon连接失败，请检查控制台输出');
                return false;
            }
        }

        try {
            RconClient.send(command);
            RconClient.on('response', str => {
                e.reply(str, true);
                return true;
            });
        } catch (error) {
            e.reply('[MC_QQ]丨Rcon发送失败，请检查控制台输出');
            Log.e(error);
            return false;
        }
    }
    async RconInit() {
        const config = await Config.getConfig();
        try {
            Init.initConfig();
            RconClient = new Rcon(
                config.rcon_host,
                config.rcon_port,
                config.rcon_password
            );

            RconClient.connect();

        } catch (error) {
            Log.e(error);
            return false;
        }
    }
}

export default new RconConnect();