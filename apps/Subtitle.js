import plugin from '../../../lib/plugins/plugin.js';
import mcBridge from '../services/mcBridge.js';

export class Subtitle extends plugin {
  constructor() {
    super({
      name: 'MCQQ-副标题消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mcst\\s+(.+)$', fnc: 'subTitle' }]
    });
  }

  async subTitle(e) {
    return mcBridge.runGroup(e, this.rule[0].reg, (match) => {
      const titleText = match[1]?.trim();
      if (!titleText) return { errorReply: '请输入要发送的副标题内容' };

      return {
        api: 'send_title',
        data: { subtitle: { text: titleText, color: 'white' } }
      };
    }, '发送副标题');
  }
}
