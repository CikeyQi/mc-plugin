import { WebSocketServer } from 'ws';
import Config from './Config.js';
import Init from '../model/init.js';
import Log from '../utils/logs.js';

class WebSocket {
  constructor() {
    this.WebSocket()
  }

  async WebSocket() {
    let config = await Config.getConfig();
    try {
      Init.initConfig();
      const wsServer = new WebSocketServer({
        port: config.mc_qq_ws_port,
        path: config.mc_qq_ws_url,
      });

      wsServer.on('listening', () => {
        Log.i(`[MC_QQ]丨WebSocket 服务器已启动，等待连接`);
        logger.info('---------------')
        logger.mark(
          logger.green(
            'Minecraft WebSocket 地址：' + logger.yellow(`ws://127.0.0.1:${config.mc_qq_ws_port}${config.mc_qq_ws_url}`)
          )
        )
        logger.info('---------------')

      });

        wsServer.on('connection', (ws,req) => {
          ws.server_name = req.headers['x-self-name'].replace(/\\u([0-9a-fA-F]{4})/g, function (match,character){
            return String.fromCharCode(parseInt(character, 16));
          })
          Log.i('[MC_QQ]丨Minecraft Server 已连接至 WebSocket 服务器');
          this.sendMsg(`[MC_QQ]丨Minecraft Server 已连接至 WebSocket 服务器[${ws.server_name}]`);
          this.wsHandler(ws);
        });
      } catch (error) {
        this.sendMsg('[MC_QQ]丨WebSocket服务启动失败，请检查控制台输出');
        Log.e(error);
        return false;
      }
    }

  wsHandler(ws) {
      ws.on('message', (message) => {
        let event;
        if (message instanceof Buffer) {
          const decodedMessage = message.toString('utf8');
          event = JSON.parse(decodedMessage);
        } else {
          event = JSON.parse(message);
        }
        switch (event.event_name) {
          case 'PlayerQuitEvent':
            this.sendMsg(`[${ws.server_name}]${event.player.nickname} 已退出游戏`);
            break;
          case 'PlayerJoinEvent':
            this.sendMsg(`[${ws.server_name}]${event.player.nickname} 已加入游戏`);
            break;
          case 'PlayerDeathEvent':
            this.sendMsg(`[${ws.server_name}]${event.player.nickname} ${event.death_message}`);
            break;
          case 'AsyncPlayerChatEvent':
            this.sendMsg(`[${ws.server_name}]${event.player.nickname} 说 ${event.message}`);
            break;
        }
      });

      ws.on('close', () => {
        this.sendMsg(`[MC_QQ]丨Minecraft Server 已断开 WebSocket 服务器[${ws.server_name}]`);
      });

      ws.on('error', (error) => {
        this.sendMsg('[MC_QQ]丨Minecraft Server WebSocket 通信出现异常：' + error);
        Log.e(error);
      });
    }

    sendMsg(msg) {
      let config = Config.getConfig();
      for (let i = 0; i < config.group_list.length; i++) {
        Bot.pickGroup(config.group_list[i]).sendMsg(msg);
      }
    }
  }

export default new WebSocket();