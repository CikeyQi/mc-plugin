import plugin from '../../../lib/plugins/plugin.js';
import mcBridge from '../services/mcBridge.js';

export class Title extends plugin {
  constructor() {
    super({
      name: 'MCQQ-标题消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mct\\s+(.+)$', fnc: 'title' }]
    });
  }

  async title(e) {
    return mcBridge.runGroup(e, this.rule[0].reg, (match) => {
      const titleText = match[1]?.trim();
      if (!titleText) return { errorReply: '请输入要发送的标题内容' };

      return {
        api: 'send_title',
        data: { title: { text: titleText, color: 'white' } }
      };
    }, '发送标题');
  }
}
