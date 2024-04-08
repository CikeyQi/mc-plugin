import plugin from '../../../lib/plugins/plugin.js'
import RconClient from '../components/Rcon.js'
import Config from '../components/Config.js'

export class Main extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MC_QQ-同步',
      /** 功能描述 */
      dsc: '同步消息',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '',
          /** 执行方法 */
          fnc: 'sync',
          /** 关闭日志 */
          log: false
        }
      ]
    })
  }

  async sync(e) {
    if (!e.group_id) return false
    const { mc_qq_send_group_name, mc_qq_server_list, debug_mode } = await Config.getConfig();
    const { servers } = RconClient
    if (!Object.keys(servers).length) return false

    const serversList = mc_qq_server_list
      .filter(server => server.rcon_able && server.group_list.includes(e.group_id))

    if (!serversList.length) return false

    let msg = mc_qq_send_group_name ? `[${e.group_name}] ` : "";
    msg += `[${e.sender.nickname}] ${e.raw_message}`

    serversList
      .map(({ server_name }) => servers[server_name])
      .filter(server => server !== undefined)
      .forEach((server, i) => {
        if (msg.startsWith(serversList[i].command_header) && e.isMaster) {
          server.send(`/${msg.replace(serversList[i].command_header, '')}`);
        } else {
          server.send(`/say ${msg}`);
        }

        if (debug_mode) {
          logger.mark(
            logger.blue('[Minecraft RCON Client] 向 ') +
            logger.green(server.server_name) +
            ' 发送消息: ' + msg
          )
        }
      })

    return false
  }
}