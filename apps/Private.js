import plugin from "../../../lib/plugins/plugin.js";
import WebSocketManager from "../components/WebSocket.js";
import Config from "../components/Config.js";

const LOG_PREFIX_CLIENT = logger.blue('[Minecraft Client] ');
const LOG_PREFIX_WS = logger.blue('[Minecraft WebSocket] ');

export class Private extends plugin {
  constructor() {
    super({
      name: "MCQQ-发送私聊消息",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcp (.*) (.*)",
          fnc: "private",
        },
      ],
    });
  }

  async private(e) {
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

      const [, nickname, message] = e.msg.match(this.rule[0].reg);

      const wsPayload = JSON.stringify({
        api: "send_private_msg",
        data: { nickname: nickname, message: message },
        echo: String(Date.now())
      });
      try {
        wsConnection.send(wsPayload);
        if (debugMode) {
          logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息 (WebSocket): ${message}`);
        }
      } catch (error) {
        if (debugMode) logger.error(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息失败 (WebSocket): ${error.message}`);
      }
    }
    return true;
  }
}
