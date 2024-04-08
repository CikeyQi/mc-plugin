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
    const { mc_qq_send_group_name, mc_qq_server_list } = await Config.getConfig();
    const { servers } = RconClient
    if (!servers.length) return false

    const serversList = mc_qq_server_list
      .filter(server => server.rcon_enable && server.group_list.includes(e.group_id))

    if (!serversList.length) return false

    let msg = mc_qq_send_group_name ? `[${e.group_name}] ` : "";
    msg += `[${e.sender.nickname}] ${e.raw_message}`

    serversList
      .map(server => servers[server.server_name])
      .filter(server => server !== undefined)
      .forEach(server => server.send(`/say ${msg}`))

    return false
  }
}