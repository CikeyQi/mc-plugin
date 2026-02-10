import plugin from '../../../lib/plugins/plugin.js';
import mcBridge from '../services/mcBridge.js';

export class Private extends plugin {
  constructor() {
    super({
      name: 'MCQQ-私聊消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mcp\\s+(\\S+)\\s+(.+)$', fnc: 'private' }]
    });
  }

  async private(e) {
    return mcBridge.runGroup(e, this.rule[0].reg, (match) => {
      const targetName = match[1]?.trim();
      const targetText = match[2]?.trim();
      if (!targetName || !targetText) return { errorReply: '请输入正确的私聊格式: #mcp <玩家> <内容>' };

      return {
        api: 'send_private_msg',
        data: { nickname: targetName, message: [{ text: targetText, color: 'white' }] }
      };
    }, '发送私聊');
  }
}
