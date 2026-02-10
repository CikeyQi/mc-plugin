import plugin from '../../../lib/plugins/plugin.js';
import mcBridge from '../services/mcBridge.js';

export class ActionBar extends plugin {
  constructor() {
    super({
      name: 'MCQQ-动作栏消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mcab\\s+(.+)$', fnc: 'actionBar' }]
    });
  }

  async actionBar(e) {
    return mcBridge.runGroup(e, this.rule[0].reg, (match) => {
      const barText = match[1]?.trim();
      if (!barText) return { errorReply: '请输入要发送的动作栏内容' };

      return {
        api: 'send_actionbar',
        data: { message: [{ text: barText, color: 'white' }] }
      };
    }, '发送动作栏');
  }
}
