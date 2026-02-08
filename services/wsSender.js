import { LOG_PREFIX_WS } from '../components/logging/prefixes.js';

export function createEchoId() {
  return String(Date.now()) + Math.floor(Math.random() * 10000);
}

export function sendWsPayload(wsConnection, serverName, payload, debugMode, logMessage) {
  if (!wsConnection || wsConnection.readyState !== 1) {
    logger.error(LOG_PREFIX_WS + `${serverName} WebSocket 未连接，无法发送消息`);
    return false;
  }
  try {
    wsConnection.send(JSON.stringify(payload));
    if (debugMode) {
      const info = logMessage || JSON.stringify(payload.data ?? {});
      logger.mark(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息 (WebSocket): ${info}`);
    }
    return true;
  } catch (error) {
    logger.error(LOG_PREFIX_WS + `向 ${logger.green(serverName)} 发送消息失败 (WebSocket): ${error.message}`);
    return false;
  }
}
