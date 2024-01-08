import Rcon from 'rcon';
import Config from './Config.js';
import Init from '../model/init.js';
import Log from '../utils/logs.js';

let RconClient = null;

class RconConnect {
    constructor() {
        this.RconInit();
    }

    async sendCommand(e, command, isCommand) {

        const config = await Config.getConfig();

        if (config.rcon_enable !== true) {
            Log.i('[QQ_MC]丨Rcon未启用');
            return true;
        }

        if (!RconClient) {
            await this.RconInit();
            if (!RconClient) {
                e.reply('[QQ_MC]丨Rcon连接失败，请检查控制台输出');
                return true;
            }
        }

        Log.i('[QQ_MC]丨Rcon发送命令：' + command);

        try {
            RconClient.send(command);

            RconClient.removeAllListeners('response');

            RconClient.on('response', str => {
                if (isCommand) {
                    Log.i('[QQ_MC]丨Rcon返回：' + str);
                    str = str.replace(eval(config.mask_word),'');   //过滤屏蔽词
                    e.reply(str, true);
                }
                return true;
            });
        } catch (error) {
            e.reply('[QQ_MC]丨Rcon发送失败，请检查控制台输出');
            Log.e(error);
            return false;
        }
    }
    async RconInit() {
        const config = await Config.getConfig();

        if (config.rcon_enable !== true) {
            Log.i('[QQ_MC]丨Rcon未启用');
            return false;
        }

        try {
            Init.initConfig();
            RconClient = new Rcon(
                config.rcon_host,
                config.rcon_port,
                config.rcon_password
            );

            RconClient.connect();

            RconClient.on('auth', () => {
                Log.i('[QQ_MC]丨Rcon 已连接至 Minecraft Server');
            });

            RconClient.on('error', (error) => {
                Log.e(error);
            });
        } catch (error) {
            Log.e(error);
            return false;
        }
    }
}

export default new RconConnect();
