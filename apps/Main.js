import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import RconClient from '../components/Rcon.js'
import Config from '../components/Config.js'


export class Main extends plugin {
  constructor() {
    super({
      name: 'QQ_MC',
      dsc: 'QQ群与Minecraft服务器的消息互通',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?mc测试$',
        fnc: 'main',
      }]
    })

  }

  async main(e) {
    let connect = WebSocket.connections
    let server = RconClient.servers
    logger.info(connect)
    logger.info(server)

  
    return false;
  }
}
