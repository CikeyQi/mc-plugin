import plugin from "../../../lib/plugins/plugin.js";
import RconManager from "../components/Rcon.js";
import WebSocketManager from "../components/WebSocket.js";
import Config from "../components/Config.js";

const LOG_PREFIX_CLIENT = logger.blue('[Minecraft Client] ');
const LOG_PREFIX_RCON = logger.blue('[Minecraft RCON] ');
const LOG_PREFIX_WS = logger.blue('[Minecraft WebSocket] ');

export class Subtitle extends plugin {
  constructor() {
    super({
      name: "MCQQ-发送子标题",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcst (.*)",
          fnc: "subTitle",
        },
      ],
    });
  }

  async subTitle(e) {
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

      const [, message] = e.msg.match(this.rule[0].reg);

      if (wsConnection) {
        const wsPayload = JSON.stringify({
          api: "send_title",
          data: { title: "", subtitle: message },
          echo: String(Date.now())
        });
        try {
          wsConnection.send(wsPayload);
          if (debugMode) {
            logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息 (WebSocket): ${message}`);
          }
        } catch (error) {
          if (debugMode) logger.error(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息失败 (WebSocket): ${error.message}`);
          if (rconConnection) {
            if (debugMode) logger.info(LOG_PREFIX_WS + `WebSocket发送失败，尝试使用RCON发送到 ${serverName}`);
            const response = await rconConnection.send(`title @a subtitle {"text":"${message}"}`);
            await rconConnection.send(`title @a title {"text":""}`);
            if (response === null && debugMode) {
              logger.warn(LOG_PREFIX_RCON + `title 命令发送到 ${logger.green(serverName)} 失败或无响应`);
            }
          }
        }
      } else if (rconConnection) {
        const response = await rconConnection.send(`title @a subtitle {"text":"${message}"}`);
        await rconConnection.send(`title @a title {"text":""}`);
        if (response === null && debugMode) {
          logger.warn(LOG_PREFIX_RCON + `title 命令发送到 ${logger.green(serverName)} 失败或无响应`);
        }
      } else {
        if (debugMode) logger.warn(LOG_PREFIX_CLIENT + `${serverName} 无可用连接方式 (WebSocket/RCON) 来同步聊天消息`);
      }
    }
    return true;
  }
}
