import Config from '../components/Config.js';
import WebSocketManager from '../components/WebSocket.js';
import { LOG_PREFIX_CLIENT } from '../components/logging/prefixes.js';

function selectServersForGroup(serverList, groupId) {
  const gid = String(groupId);
  return serverList.filter((serverCfg) =>
    serverCfg.group_list?.some((id) => String(id) === gid)
  );
}

export async function withGroupServers(e, handler, configOverride) {
  if (!e.isGroup) return false;

  const config = configOverride || Config.getConfig();
  const debugMode = Boolean(config?.debug_mode);
  const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];

  if (serverList.length === 0) {
    if (debugMode) logger.info(LOG_PREFIX_CLIENT + '无服务器配置，跳过同步');
    return false;
  }

  const targets = selectServersForGroup(serverList, e.group_id);
  if (targets.length === 0) {
    if (debugMode) logger.info(LOG_PREFIX_CLIENT + `群 ${e.group_id} 未关联任何服务器，跳过同步`);
    return false;
  }

  for (const serverCfg of targets) {
    await handler({
      serverCfg,
      serverName: serverCfg.server_name,
      wsConnection: WebSocketManager.activeSockets?.[serverCfg.server_name],
      config,
      debugMode
    });
  }

  return true;
}

export async function withConnectedServers(e, handler, configOverride) {
  return withGroupServers(
    e,
    async (ctx) => {
      if (!ctx.wsConnection) {
        if (ctx.debugMode) {
          logger.mark(LOG_PREFIX_CLIENT + logger.yellow(ctx.serverName) + ' 未连接 (WebSocket 不可用)');
        }
        return;
      }
      await handler(ctx);
    },
    configOverride
  );
}
