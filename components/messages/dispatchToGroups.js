import { extractCICodeImage } from './ciCode.js';
import { safeRegExp } from '../utils/regex.js';

export function dispatchToGroups(messageContent, serverCfg) {
  if (!messageContent || !serverCfg) return;

  const serverName = serverCfg.server_name || '未知服务器';
  const botIds = Array.isArray(serverCfg.bot_self_id) ? serverCfg.bot_self_id.filter(Boolean) : [];
  const groupIds = Array.isArray(serverCfg.group_list) ? serverCfg.group_list.filter(Boolean) : [];

  if (botIds.length === 0) {
    logger.error(`服务器 ${serverName} 未配置推送机器人ID，忽略消息`);
    return;
  }

  if (groupIds.length === 0) {
    logger.error(`服务器 ${serverName} 未配置群组列表，忽略消息`);
    return;
  }

  let content = typeof messageContent === 'string' ? messageContent : String(messageContent ?? '');
  if (serverCfg.mask_word) {
    const reg = safeRegExp(serverCfg.mask_word, 'g');
    if (reg) {
      content = content.replace(reg, '');
    } else {
      logger.warn(`服务器 ${serverName} 的屏蔽词正则无效，已忽略`);
    }
  }

  if (!content || !content.trim()) return;

  const { text, imageUrl } = extractCICodeImage(content);
  const imageSegment = imageUrl && global.segment ? segment.image(imageUrl) : null;
  if (imageUrl && !imageSegment) {
    logger.warn(`检测到图片消息，但未找到 segment 处理器，将只发送文本`);
  }
  const msg = imageSegment ? [text, imageSegment] : text;

  botIds.forEach((botId) => {
    const bot = Bot?.[botId];
    if (!bot) {
      logger.error(`机器人 ${botId} 不存在或未登录，无法发送消息`);
      return;
    }
    groupIds.forEach((groupId) => {
      try {
        const gid = String(groupId);
        bot.pickGroup(gid).sendMsg(msg);
        logger.info(`机器人 ${botId} 发送到群 ${gid}${imageUrl ? ' (含图片)' : ''}`);
      } catch (error) {
        logger.error(`机器人 ${botId} 发送到群 ${groupId} 失败: ${error.message}`);
      }
    });
  });
}
