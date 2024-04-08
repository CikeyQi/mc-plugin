import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import RconClient from '../components/Rcon.js'
import Config from '../components/Config.js'

export class Status extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MC_QQ-状态',
      /** 功能描述 */
      dsc: '服务器状态',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '#?mc状态$',
          /** 执行方法 */
          fnc: 'status',
        }
      ]
    })
  }

  async status(e) {
    try {
      const connections = WebSocket.connections
      const server = RconClient.servers
      const config = await Config.getConfig().mc_qq_server_list

      let msg = `当前连接状态：\n`

      config.forEach(async (item) => {
        msg += '\n';
        msg += `┌ 服务器名称：${item.server_name}\n`;
        msg += `├ WebSocket连接状态：${connections[item.server_name] ? '已连接' : '未连接'}\n`;
        msg += `└ Rcon连接状态：${item.rcon_able ? (server[item.server_name] ? '已连接' : '未连接') : '已关闭'}\n`;
      })

      await e.reply(msg)
    } catch (error) {
      logger.error(error)
      await e.reply('查询失败，请检查配置文件')
    }

    return true
  }
}
