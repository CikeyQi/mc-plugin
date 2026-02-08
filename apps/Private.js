import plugin from "../../../lib/plugins/plugin.js";
import { withConnectedServers } from '../services/groupDispatch.js';
import { createEchoId, sendWsPayload } from '../services/wsSender.js';
import { toTextComponentArray } from '../components/messages/textComponent.js';

export class Private extends plugin {
  constructor() {
    super({
      name: "MCQQ-私聊消息",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcp (.*) (.*)",
          fnc: "private",
        },
      ],
    });
  }

  async private(e) {
    if (!e.isGroup) {
      return false;
    }

    const content = e.msg ?? '';
    const match = content.match(this.rule[0].reg);
    if (!match) return false;

    const nickname = match[1]?.trim();
    const message = match[2]?.trim();

    if (!nickname || !message) {
      await e.reply('请输入正确的私聊格式: #mcp <玩家> <内容>');
      return true;
    }

    const messageComponents = toTextComponentArray(message, 'white');

    await withConnectedServers(e, async ({ serverName, wsConnection, debugMode }) => {
      const payload = {
        api: 'send_private_msg',
        data: { nickname, message: messageComponents },
        echo: createEchoId()
      };
      sendWsPayload(wsConnection, serverName, payload, debugMode, message);
    });

    return true;
  }
}
