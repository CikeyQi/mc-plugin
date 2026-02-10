import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/Config.js';
import mcBridge from '../services/mcBridge.js';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const allowCommand = (serverItem, e) => {
  if (e.isMaster) return true;
  const userList = Array.isArray(serverItem?.command_user) ? serverItem.command_user : [];
  return userList.some((userItem) => String(userItem) === String(e.user_id));
};

const readCommand = (msgText, serverItem) => {
  const text = String(msgText ?? '');
  const head = String(serverItem?.command_header || '/');
  return head && text.startsWith(head) ? text.slice(head.length).trim() : null;
};

const formatResult = (rawReply) => {
  if (rawReply === null || rawReply === undefined || rawReply === '') return '命令执行成功';

  if (typeof rawReply === 'string') {
    const parsed = parseJson(rawReply);
    return parsed ? formatResult(parsed) : rawReply;
  }

  if (!isRecord(rawReply)) return String(rawReply);

  if (rawReply.data !== null && rawReply.data !== undefined && rawReply.data !== '') {
    return typeof rawReply.data === 'string' ? rawReply.data : toJson(rawReply.data);
  }

  const status = String(rawReply.status || '').trim().toUpperCase();
  const text = String(rawReply.message || '').trim();
  if (status && status !== 'SUCCESS') return text || `命令执行失败 (${status})`;
  return text || '命令执行成功';
};

const toMcMessage = (e, config) => {
  const list = [];

  if (config?.mc_qq_send_group_name && e.group_name) {
    list.push({ text: `[${e.group_name}] `, color: 'aqua' });
  }

  const nick = e.sender?.nickname || e.sender?.card || String(e.user_id ?? '未知用户');
  const sayWord = config?.mc_qq_say_way || '说：';
  list.push({ text: nick, color: 'green' }, { text: ` ${sayWord} `, color: 'white' });

  const msgList = Array.isArray(e.message) ? e.message : [{ type: 'text', text: e.msg ?? '' }];

  for (const msgItem of msgList) {
    if (msgItem.type === 'text') {
      list.push({
        text: String(msgItem.text ?? '').replace(/\r/g, '').replace(/\n/g, '\n * '),
        color: 'white'
      });
      continue;
    }

    if (msgItem.type === 'image') {
      const imageUrl = String(msgItem.url || '');
      if (config?.mc_qq_chat_image_enable) {
        list.push({ text: `[[CICode,url=${imageUrl},name=图片]]` });
      } else {
        list.push({
          text: '[图片]',
          color: 'light_purple',
          hoverEvent: {
            action: 'show_text',
            value: { text: '点击跳转至浏览器查看', color: 'light_purple' }
          },
          clickEvent: { action: 'open_url', value: imageUrl }
        });
      }
      continue;
    }

    list.push({ text: `[${msgItem.type}] ${msgItem.text || ''}`.trim(), color: 'white' });
  }

  return list;
};

export class Main extends plugin {
  constructor() {
    super({
      name: 'MCQQ-聊天消息',
      event: 'message',
      priority: 1009,
      rule: [{ reg: '', fnc: 'handleSync', log: true }]
    });
  }

  async handleSync(e) {
    if (!e.isGroup) return false;

    const config = Config.getConfig();
    await mcBridge.eachServer(e, async ({ serverItem, serverName, debugMode }) => {
      const commandText = readCommand(e.msg, serverItem);
      if (commandText !== null) {
        if (allowCommand(serverItem, e)) await this.sendCommand(e, serverName, commandText, debugMode);
        return;
      }

      try {
        await mcBridge.request(serverName, 'broadcast', { message: toMcMessage(e, config) });
      } catch (error) {
        if (debugMode) logger.warn(`[MC-PLUGIN] 向 ${serverName} 同步群聊失败: ${error?.message || 'unknown error'}`);
      }
    }, config);

    return false;
  }

  async sendCommand(e, serverName, commandText, debugMode) {
    if (!commandText) {
      await e.reply('请输入要执行的命令');
      return;
    }

    try {
      const replyData = await mcBridge.request(serverName, 'send_rcon_command', { command: commandText }, { timeoutMs: 5000 });
      await e.reply(formatResult(replyData));
      if (debugMode) logger.info(`[MC-PLUGIN] 已向 ${serverName} 发送命令: ${commandText}`);
    } catch (error) {
      const errorText = error?.message || 'unknown error';
      logger.error(`[MC-PLUGIN] 向 ${serverName} 发送命令失败: ${errorText}`);
      await e.reply(`向 ${serverName} 发送命令失败: ${errorText}`);
    }
  }
}
