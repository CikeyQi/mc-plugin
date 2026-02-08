import plugin from "../../../lib/plugins/plugin.js";
import { withConnectedServers } from '../services/groupDispatch.js';
import { createEchoId, sendWsPayload } from '../services/wsSender.js';
import { toTextComponent } from '../components/messages/textComponent.js';

export class Title extends plugin {
  constructor() {
    super({
      name: "MCQQ-标题消息",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mct (.*)",
          fnc: "title",
        },
      ],
    });
  }

  async title(e) {
    if (!e.isGroup) {
      return false;
    }

    const content = e.msg ?? '';
    const match = content.match(this.rule[0].reg);
    if (!match) return false;

    const message = match[1]?.trim();
    if (!message) {
      await e.reply('请输入要发送的标题内容');
      return true;
    }

    const titleComponent = toTextComponent(message, 'aqua');

    await withConnectedServers(e, async ({ serverName, wsConnection, debugMode }) => {
      const payload = {
        api: 'send_title',
        data: { title: titleComponent },
        echo: createEchoId()
      };
      sendWsPayload(wsConnection, serverName, payload, debugMode, message);
    });

    return true;
  }
}
