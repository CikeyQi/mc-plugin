import plugin from '../../../lib/plugins/plugin.js';
import WebSocketManager from '../components/WebSocket.js';
import { addResponse } from '../components/Response.js';
import Config from '../components/Config.js';

const LOG_PREFIX_CLIENT = logger.blue('[Minecraft Client] ');
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
      const wsConnection = WebSocketManager.activeSockets?.[serverName];

      if (!wsConnection) {
        if (debugMode) {
          logger.mark(LOG_PREFIX_CLIENT + logger.yellow(serverName) + ' 未连接 (WebSocket 不可用)');
        }
        continue;
      }

      const isCommand = e.msg?.startsWith(serverCfg.command_header);
      const canExecuteCommand = serverCfg.command_user?.some(user => user == e.user_id) || e.isMaster;

      if (isCommand && canExecuteCommand) {
        await this._handleServerCommand(e, serverCfg, wsConnection, debugMode);
      } else if (!isCommand) {
        await this._handleChatMessageSync(e, serverCfg, wsConnection, globalConfig);
      }
    }

    return false;
  }

  async _handleServerCommand(e, serverCfg, wsConnection, debugMode) {
    const serverName = serverCfg.server_name;

    if (!wsConnection) {
      await e.reply(`${serverName} 的 WebSocket 未连接，无法执行服务器命令`);
      if (debugMode) logger.warn(LOG_PREFIX_WS + `${serverName} WebSocket 未连接，命令执行中止`);
      return;
    }

    const command = e.msg.substring(serverCfg.command_header.length);
    if (debugMode) {
      logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送命令: ${logger.yellow(command)}`);
    }
    const echoId = String(Date.now()) + Math.floor(Math.random() * 10000);
    addResponse(echoId, e, 5000);
    const commandJsonData = JSON.stringify({ api: "send_rcon_command", data: { command }, echo: echoId });
    try {
      wsConnection.send(commandJsonData);
    } catch (err) {
      e.sendMsg(`向 ${serverName} 发送命令失败: ${err.message || err}`);
      logger.error(LOG_PREFIX_WS + `发送命令失败: ${err.message || err}`);
    }
  }

  _formatMinecraftMessage(e, globalConfig) {
    const { mc_qq_send_group_name: prefixGroup, mc_qq_say_way: saySuffix, mc_qq_chat_image_enable: imageAsCICode } = globalConfig;

    const componentList = [];

    if (prefixGroup) {
      componentList.push({
        text: `[${e.group_name}] `,
        color: "aqua"
      });
    }

    componentList.push({
      text: e.sender.nickname,
      color: "green"
    });

    componentList.push({
      text: ` ${saySuffix || '说:'} `,
      color: "white"
    });

    e.message.forEach(element => {
      switch (element.type) {
        case 'text':
          componentList.push({
            text: element.text.replace(/\r/g, "").replace(/\n/g, "\n * "),
            color: "white"
          });
          break;
        case 'image':
          if (imageAsCICode) {
            componentList.push({
              text: `[[CICode,url=${element.url},name=图片]]`,
            });
          } else {
            componentList.push({
              text: `[图片]`,
              color: "light_purple",
              hoverEvent: {
                action: "show_text",
                value: {
                  text: "点击跳转至浏览器查看",
                  color: "light_purple"
                }
              },
              clickEvent: {
                action: "open_url",
                value: element.url
              }
            });
          }
          break;
        default:
          componentList.push({
            text: `[${element.type}] ${element.text || ''}`,
            color: "white",
          });
          break;
      }
    });
    return componentList;
  }

  async _handleChatMessageSync(e, serverCfg, wsConn, globalConfig) {
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
          logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息 (WebSocket): ${JSON.stringify(message)}`);
        }
      } catch (error) {
        if (debugMode) logger.error(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息失败 (WebSocket): ${error.message}`);
      }
    } else {
      if (debugMode) logger.warn(LOG_PREFIX_CLIENT + `${serverName} 无可用连接方式 (WebSocket/RCON) 来同步聊天消息`);
    }
  }

}
