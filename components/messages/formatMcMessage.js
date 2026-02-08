import { getPlainTextFromRawMessage } from './componentText.js';

export function formatMcMessage(jsonData, config) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { message: null, reason: 'invalid_payload' };
  }

  const postType = jsonData.post_type;
  if (postType && postType !== 'message' && postType !== 'notice') {
    return { message: null, reason: 'unsupported_post_type' };
  }

  const showServer = Boolean(config?.mc_qq_display_server_name);
  const serverName = jsonData.server_name ? String(jsonData.server_name) : '未知服务器';
  const messagePrefix = showServer ? `[${serverName}] ` : '';

  const nickname = jsonData.player?.nickname ? String(jsonData.player.nickname) : '未知玩家';

  const handlers = {
    player_join: () => `${nickname} 加入了游戏`,
    player_quit: () => `${nickname} 退出了游戏`,
    player_death: () => {
      const death = jsonData.death;
      const deathText = typeof death?.text === 'string'
        ? death.text
        : typeof death?.translate?.text === 'string'
          ? death.translate.text
          : '';
      return deathText || `${nickname} 死亡了`;
    },
    player_command: () => `${nickname} 使用命令 ${String(jsonData.command || '')}`.trim(),
    player_achievement: () => {
      const achievement = jsonData.achievement || {};
      const translateText = typeof achievement.translate?.text === 'string'
        ? achievement.translate.text
        : typeof achievement.text === 'string'
          ? achievement.text
          : '';

      if (translateText) {
        return translateText;
      }

      const displayTitle = achievement.display?.title;
      if (displayTitle) {
        const titleText = typeof displayTitle === 'object'
          ? displayTitle.text || displayTitle.translate?.text
          : String(displayTitle);
        return titleText ? `${nickname} 达成了进度 ${titleText}` : null;
      }

      return null;
    },
    player_chat: () => {
      const sayConnector = config?.mc_qq_say_way || '说：';
      const message = String(jsonData.message ?? '').trim();
      const rawMessage = getPlainTextFromRawMessage(jsonData.raw_message);
      const content = message || String(rawMessage || '').trim();
      return content ? `${nickname} ${sayConnector} ${content}`.trim() : null;
    }
  };

  const handler = handlers[jsonData.sub_type];
  if (!handler) {
    return { message: null, reason: 'unknown_type' };
  }

  const subMessage = handler();
  if (!subMessage) {
    return { message: null, reason: 'empty_message' };
  }

  return { message: messagePrefix + subMessage, reason: null };
}
