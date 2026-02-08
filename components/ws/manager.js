import Config from '../Config.js';
import { LOG_PREFIX_WS } from '../logging/prefixes.js';
import { handleIncomingMessage } from './handleIncomingMessage.js';
import { startLocalServer } from './server.js';
import { connectWithRetry } from './client.js';

class WebSocketManager {
  constructor() {
    this.wsServer = null;
    this.activeSockets = {};
    this.activeOrigins = {};
    this._initializeAsync();
  }

  async _initializeAsync() {
    try {
      const config = Config.getConfig();
      if (!config) {
        logger.error(LOG_PREFIX_WS + '无法获取配置，WebSocket服务无法启动');
        return;
      }

      if (config.mc_qq_ws_server && this.wsServer === null) {
        this.wsServer = startLocalServer(
          config,
          this.activeSockets,
          this.activeOrigins,
          (message, debugMode) => handleIncomingMessage(message, debugMode),
          () => { this.wsServer = null; }
        );
      }

      this._connectToRemoteServers(config);
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `初始化失败: ${error.message}`);
    }
  }

  _connectToRemoteServers(config) {
    const { mc_qq_server_list: remoteServers, debug_mode: debugMode } = config;

    if (!remoteServers || !Array.isArray(remoteServers)) {
      logger.info(LOG_PREFIX_WS + '未配置远程服务器列表或格式不正确');
      return;
    }

    remoteServers.forEach((serverCfg) => {
      if (serverCfg.ws_able && serverCfg.ws_url && serverCfg.server_name) {
        if (this.activeSockets[serverCfg.server_name]) {
          logger.info(LOG_PREFIX_WS + `已存在到 ${serverCfg.server_name} 的连接，跳过`);
        } else {
          connectWithRetry(
            serverCfg,
            {
              onOpen: (serverName, ws) => {
                this.activeSockets[serverName] = ws;
              },
              onMessage: (message, debugMode) => {
                handleIncomingMessage(message, debugMode);
              },
              onClose: (serverName) => {
                delete this.activeSockets[serverName];
              },
              onError: (serverName) => {
                delete this.activeSockets[serverName];
              }
            },
            debugMode
          );
        }
      } else if (serverCfg.ws_able) {
        logger.warn(LOG_PREFIX_WS + `远程服务器配置 ${serverCfg.server_name || '未命名'} 不完整，跳过`);
      }
    });
  }
}

export default new WebSocketManager();
