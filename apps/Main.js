import plugin from '../../../lib/plugins/plugin.js';
import { addResponse } from '../components/Response.js';
import Config from '../components/Config.js';
import { buildMinecraftComponents } from '../components/messages/qqToMc.js';
import { withConnectedServers } from '../services/groupDispatch.js';
import { createEchoId, sendWsPayload } from '../services/wsSender.js';

export class Main extends plugin {
  constructor() {
    super({
      name: 'MCQQ-聊天消息',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '',
          fnc: 'handleSync',
          log: false,
        },
      ],
    });
  }

  async handleSync(e) {
    if (!e.isGroup) {
      return false;
    }

    const globalConfig = Config.getConfig();

    await withConnectedServers(
      e,
      async ({ serverCfg, serverName, wsConnection, debugMode, config }) => {
        const messageText = e.msg ?? '';
        const isCommand = messageText.startsWith(serverCfg.command_header);
        const canExecuteCommand =
          serverCfg.command_user?.some((user) => user == e.user_id) || e.isMaster;

        if (isCommand && canExecuteCommand) {
          await this._handleServerCommand(e, serverCfg, wsConnection, debugMode, serverName);
        } else if (!isCommand) {
          await this._handleChatMessageSync(e, wsConnection, config, serverName, debugMode);
        }
      },
      globalConfig
    );

    return false;
  }

  async _handleServerCommand(e, serverCfg, wsConnection, debugMode, serverName) {
    const fullMsg = e.msg ?? '';
    const command = fullMsg.substring(serverCfg.command_header.length).trim();
    if (!command) {
      await e.reply('请输入要执行的命令');
      return;
    }
    const echoId = createEchoId();
    addResponse(echoId, e, 5000);

    const payload = {
      api: 'send_rcon_command',
      data: { command },
      echo: echoId
    };

    const ok = sendWsPayload(wsConnection, serverName, payload, debugMode, `命令: ${command}`);
    if (!ok) {
      e.sendMsg(`向 ${serverName} 发送命令失败`);
    }
  }

  async _handleChatMessageSync(e, wsConn, globalConfig, serverName, debugMode) {
    const message = buildMinecraftComponents(e, globalConfig);
    const payload = {
      api: 'broadcast',
      data: { message },
      echo: createEchoId()
    };
    sendWsPayload(wsConn, serverName, payload, debugMode, JSON.stringify(message));
  }

}
