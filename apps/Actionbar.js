import plugin from "../../../lib/plugins/plugin.js";
import { withConnectedServers } from '../services/groupDispatch.js';
import { createEchoId, sendWsPayload } from '../services/wsSender.js';
import { toTextComponentArray } from '../components/messages/textComponent.js';

export class ActionBar extends plugin {
  constructor() {
    super({
      name: "MCQQ-动作栏消息",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcab (.*)",
          fnc: "actionBar",
        },
      ],
    });
  }

  async actionBar(e) {
    if (!e.isGroup) {
      return false;
    }

    const content = e.msg ?? '';
    const match = content.match(this.rule[0].reg);
    if (!match) return false;

    const message = match[1]?.trim();
    if (!message) {
      await e.reply('请输入要发送的动作栏内容');
      return true;
    }

    const messageComponents = toTextComponentArray(message, 'aqua');

    await withConnectedServers(e, async ({ serverName, wsConnection, debugMode }) => {
      const payload = {
        api: 'send_actionbar',
        data: { message: messageComponents },
        echo: createEchoId()
      };
      sendWsPayload(wsConnection, serverName, payload, debugMode, message);
    });

    return true;
  }
}
