import { WebSocket } from 'ws';
import { LOG_PREFIX_WS } from '../logging/prefixes.js';

export function connectWithRetry(serverCfg, handlers, debugMode = false) {
  const {
    server_name: serverName,
    ws_url: serverUrl,
    ws_password: serverToken,
    ws_max_attempts: maxRetries = 3
  } = serverCfg;

  const retryLimit = Math.max(0, Number(maxRetries) || 3);

  const attemptConnection = (attempt) => {
    logger.info(LOG_PREFIX_WS + `尝试连接到 ${serverName} (${serverUrl})... (尝试次数: ${attempt + 1})`);

    const headers = {
      'X-Self-Name': encodeURIComponent(serverName),
      'X-Client-Origin': encodeURIComponent('mc-plugin'),
      'Authorization': serverToken ? `Bearer ${encodeURIComponent(serverToken)}` : undefined
    };
    Object.keys(headers).forEach((key) => headers[key] === undefined && delete headers[key]);

    let ws;
    try {
      ws = new WebSocket(serverUrl, { headers });
    } catch (error) {
      logger.error(
        LOG_PREFIX_WS +
        logger.red(serverName) +
        ` 连接初始化失败 ${error.message}`
      );
      if (attempt < retryLimit) {
        logger.info(LOG_PREFIX_WS + `${serverName} 将在5秒后尝试重新连接... (剩余尝试: ${retryLimit - attempt})`);
        setTimeout(() => attemptConnection(attempt + 1), 5000);
      } else {
        logger.error(LOG_PREFIX_WS + logger.red(serverName) + ` 已达到最大重连次数 (${retryLimit + 1})，放弃连接`);
        handlers?.onGiveUp?.(serverName, 'init_error');
      }
      return;
    }
    let retryScheduled = false;

    const scheduleRetry = (reason) => {
      if (retryScheduled) return;
      retryScheduled = true;
      if (attempt < retryLimit) {
        logger.info(LOG_PREFIX_WS + `${serverName} 将在5秒后尝试重新连接... (剩余尝试: ${retryLimit - attempt})`);
        setTimeout(() => attemptConnection(attempt + 1), 5000);
      } else {
        logger.error(LOG_PREFIX_WS + logger.red(serverName) + ` 已达到最大重连次数 (${retryLimit + 1})，放弃连接`);
        handlers?.onGiveUp?.(serverName, reason);
      }
    };

    ws.on('open', () => {
      logger.mark(LOG_PREFIX_WS + logger.green(serverName) + ' 已连接');
      handlers?.onOpen?.(serverName, ws);
    });

    ws.on('message', (message) => {
      handlers?.onMessage?.(message, debugMode);
    });

    ws.on('close', (code, reason) => {
      logger.mark(
        LOG_PREFIX_WS +
        logger.yellow(serverName) +
        ` 连接已断开 Code: ${code}, Reason: ${reason || 'N/A'}`
      );
      handlers?.onClose?.(serverName, code, reason);
      scheduleRetry('close');
    });

    ws.on('error', (error) => {
      logger.error(
        LOG_PREFIX_WS +
        logger.red(serverName) +
        ` 连接错误 ${error.message}`
      );
      handlers?.onError?.(serverName, error);
      scheduleRetry('error');
    });
  };

  attemptConnection(0);
}
