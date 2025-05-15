import plugin from '../../../lib/plugins/plugin.js';
import RconManager from '../components/Rcon.js';
import WebSocketManager from '../components/WebSocket.js';
import Config from '../components/Config.js';

const LOG_PREFIX_CLIENT = logger.blue('[Minecraft Client] ');
const LOG_PREFIX_RCON = logger.blue('[Minecraft RCON] ');
const LOG_PREFIX_WS = logger.blue('[Minecraft WebSocket] ');

export class Main extends plugin {
  constructor() {
    super({
      name: 'MCQQ-消息同步',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '',
          fnc: 'handleSync',
          log: false,
        },
      ],
    });
  }

  async handleSync(e) {
    if (!e.isGroup) {
      return false;
    }

    const globalConfig = await Config.getConfig();
    const { mc_qq_server_list: serverList, debug_mode: debugMode } = globalConfig;

    if (!serverList || serverList.length === 0) {
      if (debugMode) logger.info(LOG_PREFIX_CLIENT + '无服务器配置，跳过同步');
      return false;
    }

    const targetServers = serverList.filter(serverCfg =>
      serverCfg.group_list?.some(groupId => groupId == e.group_id)
    );

    if (targetServers.length === 0) {
      if (debugMode) logger.info(LOG_PREFIX_CLIENT + `群 ${e.group_id} 未关联任何服务器，跳过同步`);
      return false;
    }

    for (const serverCfg of targetServers) {
      const serverName = serverCfg.server_name;
      const rconConnection = RconManager.activeConnections?.[serverName];
      const wsConnection = WebSocketManager.activeSockets?.[serverName];

      if (!rconConnection && !wsConnection) {
        if (debugMode) {
          logger.mark(LOG_PREFIX_CLIENT + logger.yellow(serverName) + ' 未连接 (RCON 和 WebSocket 均不可用)');
        }
        continue;
      }

      const isCommand = e.msg?.startsWith(serverCfg.command_header);
      const canExecuteCommand = serverCfg.command_user?.some(user => user == e.user_id) || e.isMaster;

      if (isCommand && canExecuteCommand) {
        await this._handleServerCommand(e, serverCfg, rconConnection, debugMode);
      } else if (!isCommand) {
        await this._handleChatMessageSync(e, serverCfg, wsConnection, rconConnection, globalConfig);
      }
    }

    return false;
  }

  async _handleServerCommand(e, serverCfg, rconConn, debugMode) {
    const serverName = serverCfg.server_name;

    if (!rconConn) {
      await e.reply(`${serverName} 的 RCON 未连接，无法执行服务器命令`);
      if (debugMode) logger.warn(LOG_PREFIX_RCON + `${serverName} RCON 未连接，命令执行中止`);
      return;
    }

    const command = e.msg.substring(serverCfg.command_header.length);
    if (debugMode) {
      logger.mark(LOG_PREFIX_RCON + `向 ${logger.green(serverName)} 发送命令: ${logger.yellow(command)}`);
    }

    let response = await rconConn.send(command)

    if (response !== null) {
      if (serverCfg.mask_word) {
        try {
          response = response.replace(new RegExp(serverCfg.mask_word, "g"), '');
        } catch (err) {
          if (debugMode) logger.error(LOG_PREFIX_RCON + `屏蔽词正则错误 ${err.message}`);
        }
      }
      await e.reply(response);
      if (debugMode) {
        logger.mark(LOG_PREFIX_RCON + `${logger.green(serverName)} 返回消息: ${logger.green(response)}`);
      }
    } else {
      if (debugMode) logger.warn(LOG_PREFIX_RCON + `命令发送到 ${logger.green(serverName)} 未收到响应或失败`);
    }
  }

  _formatMinecraftMessage(e, globalConfig) {
    const { mc_qq_send_group_name: prefixGroup, mc_qq_say_way: saySuffix, mc_qq_chat_image_enable: imageAsCICode } = globalConfig;
    let messagePrefix = `${prefixGroup ? `[${e.group_name}] ` : ''}[${e.sender.nickname}] ${saySuffix || '说:'} `;

    e.message.forEach(element => {
      switch (element.type) {
        case 'text':
          messagePrefix += element.text.replace(/\r/g, "").replace(/\n/g, "\n * ");
          break;
        case 'image':
          if (imageAsCICode) {
            messagePrefix += `[[CICode,url=${element.url},name=图片]]`;
          } else {
            messagePrefix += `[图片]`;
          }
          break;
        default:
          messagePrefix += `[${element.type}] ${element.text || ''}`;
          break;
      }
    });
    return messagePrefix;
  }

  async _handleChatMessageSync(e, serverCfg, wsConn, rconConn, globalConfig) {
    const serverName = serverCfg.server_name;
    const { debug_mode: debugMode } = globalConfig;

    const message = this._formatMinecraftMessage(e, globalConfig);

    if (wsConn) {
      const wsPayload = JSON.stringify({
        api: "send_msg",
        data: { message: message },
        echo: String(Date.now())
      });
      try {
        wsConn.send(wsPayload);
        if (debugMode) {
          logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息 (WebSocket): ${message}`);
        }
      } catch (error) {
        if (debugMode) logger.error(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息失败 (WebSocket): ${error.message}`);
        if (rconConn) {
          if (debugMode) logger.info(LOG_PREFIX_WS + `WebSocket发送失败，尝试使用RCON发送到 ${serverName}`);
          await this._sendChatMessageViaRcon(message, serverName, rconConn, debugMode);
        }
      }
    } else if (rconConn) {
      await this._sendChatMessageViaRcon(message, serverName, rconConn, debugMode);
    } else {
      if (debugMode) logger.warn(LOG_PREFIX_CLIENT + `${serverName} 无可用连接方式 (WebSocket/RCON) 来同步聊天消息`);
    }
  }

  async _sendChatMessageViaRcon(message, serverName, rconConn, debugMode) {
    const tellrawCommand = `tellraw @a {"text":"${message}"}`;

    if (debugMode) {
      logger.mark(LOG_PREFIX_RCON + `向 ${logger.green(serverName)} 发送消息 (RCON tellraw): ${tellrawCommand}`);
    }
    const response = await rconConn.send(tellrawCommand);
    if (response === null && debugMode) {
      logger.warn(LOG_PREFIX_RCON + `tellraw 命令发送到 ${logger.green(serverName)} 失败或无响应`);
    }
  }
}
