import { safeJsonParse } from '../utils/safeJson.js';
import processAndSend from '../SendMsg.js';
import { handleResponse } from '../Response.js';
import { LOG_PREFIX_WS } from '../logging/prefixes.js';

export function handleIncomingMessage(rawMessage, debugMode = false) {
  const messageText = typeof rawMessage === 'string' ? rawMessage : rawMessage?.toString?.() ?? '';
  if (debugMode) {
    logger.mark(LOG_PREFIX_WS + ' 收到消息：' + logger.green(messageText));
  }

  const parsed = safeJsonParse(messageText);
  if (!parsed.ok) {
    logger.error(LOG_PREFIX_WS + `消息解析失败: ${parsed.error?.message || '未知错误'}，内容: ${messageText}`);
    return;
  }

  const msgObj = parsed.value;
  if (msgObj?.post_type === 'response' && msgObj?.echo) {
    handleResponse(msgObj.echo, msgObj);
  } else {
    processAndSend(msgObj);
  }
}
