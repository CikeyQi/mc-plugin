import plugin from "../../../lib/plugins/plugin.js";
import { withConnectedServers } from '../services/groupDispatch.js';
import { createEchoId, sendWsPayload } from '../services/wsSender.js';
import { toTextComponent } from '../components/messages/textComponent.js';

export class Subtitle extends plugin {
  constructor() {
    super({
      name: "MCQQ-子标题消息",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcst (.*)",
          fnc: "subTitle",
        },
      ],
    });
  }

  async subTitle(e) {
    if (!e.isGroup) {
      return false;
    }

    const content = e.msg ?? '';
    const match = content.match(this.rule[0].reg);
    if (!match) return false;

    const message = match[1]?.trim();
    if (!message) {
      await e.reply('请输入要发送的子标题内容');
      return true;
    }

    const subtitleComponent = toTextComponent(message, 'white');

    await withConnectedServers(e, async ({ serverName, wsConnection, debugMode }) => {
      const payload = {
        api: 'send_title',
        data: { subtitle: subtitleComponent },
        echo: createEchoId()
      };
      sendWsPayload(wsConnection, serverName, payload, debugMode, message);
    });

    return true;
  }
}
