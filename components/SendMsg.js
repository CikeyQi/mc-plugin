import Config from "./Config.js";
import { parseMcMessage } from './messages/parseMcMessage.js';
import { formatMcMessage } from './messages/formatMcMessage.js';
import { dispatchToGroups } from './messages/dispatchToGroups.js';

export default function processAndSend(rawMessage) {
  const config = Config.getConfig();
  const parsed = parseMcMessage(rawMessage);
  if (!parsed.ok) {
    logger.error(`解析消息失败: ${parsed.error?.message || '未知错误'}. 原始消息: ${rawMessage}`);
    return;
  }

  const jsonData = parsed.value;
  const { message, reason } = formatMcMessage(jsonData, config);

  if (!message) {
    if (reason === 'unknown_type') {
      logger.info(`服务器 ${jsonData.server_name} 的未知的上报类型 ${jsonData.sub_type}`);
    }
    return;
  }

  const serverList = Array.isArray(config.mc_qq_server_list) ? config.mc_qq_server_list : [];
  const serverName = String(jsonData.server_name ?? '');
  const serverCfg = serverList.find((s) => String(s.server_name) === serverName);

  if (!serverCfg) {
    logger.info(`服务器 ${serverName || '未知服务器'} 未在配置文件中找到，忽略消息`);
    return;
  }

  dispatchToGroups(message, serverCfg);
}
