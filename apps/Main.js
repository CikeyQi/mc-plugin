import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import RconConnect from '../components/Rcon.js'
import Config from '../components/Config.js'


export class Main extends plugin {
  constructor() {
    super({
      name: 'QQ_MC',
      dsc: 'QQ群与Minecraft服务器的消息互通',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '',
        fnc: 'main',
        log: false
      }]
    })

  }

  async main(e) {
    const config = await Config.getConfig();
    if (e.raw_message.startsWith(config.command_header) && e.isMaster) {
      const shell = e.raw_message.replace(new RegExp(config.command_header, 'g'), '');
      RconConnect.sendCommand(e, shell, true);
      return false;
    }
  
    if (e.isGroup && config.group_list.includes(e.group_id)) {
      let shell = '';
      const groupPrefix = config.mc_qq_send_group_name ? `[${e.group_name}](${e.sender.nickname}) ` : `(${e.sender.nickname}) `;
  
      if (e.img) {
        shell = `tellraw @a {"text":"","extra":[{"text":"${groupPrefix}§2${e.raw_message}","color":"white","bold":"false","clickEvent":{"action":"open_url","value":"${e.img[0]}"}}]}`;
      } else {
        shell = `tellraw @a {"text":"","extra":[{"text":"${groupPrefix}${e.raw_message}","color":"white","bold":"false"}]}`;
      }
  
      RconConnect.sendCommand(e, shell, false);
    }
  
    return false;
  }
}
