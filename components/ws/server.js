import { WebSocketServer, WebSocket } from 'ws';
import { LOG_PREFIX_WS } from '../logging/prefixes.js';

export function startLocalServer(config, activeSockets, activeOrigins, onMessage, onFatal) {
  const { mc_qq_ws_port: wsPort, mc_qq_ws_url: wsPath, mc_qq_ws_password: wsPassword, debug_mode: debugMode } = config;

  if (!wsPort || !wsPath) {
    logger.error(LOG_PREFIX_WS + 'WebSocket服务器端口或路径未配置，无法启动');
    return null;
  }

  const wss = new WebSocketServer({ port: wsPort, path: wsPath });

  wss.on('listening', () => {
    logger.mark(
      LOG_PREFIX_WS +
      '监听地址：' +
      logger.green(`ws://localhost:${wsPort}${wsPath}`)
    );
  });

  wss.on('connection', (ws, request) => {
    let remoteName;
    try {
      const nameHeader = request.headers['x-self-name'];
      remoteName = nameHeader ? decodeURIComponent(nameHeader) : '';
      const originHeader = request.headers['x-client-origin'];
      const clientOrigin = originHeader ? decodeURIComponent(originHeader) : '';
      let authToken = decodeURIComponent(request.headers['authorization'] || '');
      authToken = authToken.replace(/^Bearer\s*/i, '');

      if (!remoteName) {
        ws.close(1008, 'Invalid remote name');
        return;
      }

      if (wsPassword && authToken !== wsPassword) {
        ws.close(1008, 'Invalid token');
        logger.mark(
          LOG_PREFIX_WS +
          logger.yellow(remoteName) +
          ' 尝试连接，但令牌无效，已拒绝'
        );
        return;
      }

      if (activeSockets[remoteName]) {
        ws.close(1000, 'Duplicate connection');
        logger.mark(
          LOG_PREFIX_WS +
          logger.yellow(remoteName) +
          ' 尝试连接，但已存在同名连接，已拒绝'
        );
        return;
      }

      if (clientOrigin && activeOrigins?.[clientOrigin]) {
        ws.close(1000, 'Duplicate origin');
        logger.mark(
          LOG_PREFIX_WS +
          logger.yellow(remoteName) +
          ` 尝试连接，但来源 ${clientOrigin} 已存在，已拒绝`
        );
        return;
      }

      logger.mark(LOG_PREFIX_WS + logger.green(remoteName) + ' 已连接');
      activeSockets[remoteName] = ws;
      if (clientOrigin && activeOrigins) {
        activeOrigins[clientOrigin] = ws;
      }

      ws.on('message', (message) => {
        onMessage(message, debugMode);
      });

      ws.on('close', (code, reason) => {
        logger.mark(
          LOG_PREFIX_WS +
          logger.yellow(remoteName) +
          ` 已断开 Code: ${code}, Reason: ${reason || 'N/A'}`
        );
        delete activeSockets[remoteName];
        if (clientOrigin && activeOrigins?.[clientOrigin] === ws) {
          delete activeOrigins[clientOrigin];
        }
      });

      ws.on('error', (error) => {
        logger.error(
          LOG_PREFIX_WS +
          logger.red(remoteName) +
          ` 连接出错 ${error.message}`
        );
        delete activeSockets[remoteName];
        if (clientOrigin && activeOrigins?.[clientOrigin] === ws) {
          delete activeOrigins[clientOrigin];
        }
      });
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `处理来自 ${remoteName ? logger.red(remoteName) : '未知服务器'} 的新连接时出错: ${error.message}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Internal server error');
      }
    }
  });

  wss.on('error', (error) => {
    logger.error(LOG_PREFIX_WS + `本地服务器错误: ${error.message}`);
    wss.removeAllListeners();
    wss.close();
    if (onFatal) onFatal(error);
  });

  return wss;
}
