import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import Config from '../components/Config.js'

export class Status extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MCQQ-连接状态',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '#?mc(状态| status)$',
          /** 执行方法 */
          fnc: 'status',
        }
      ]
    })
  }

  async status(e) {
    try {
      const activeSockets = WebSocket.activeSockets
      const config = Config.getConfig()
      const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []

      let msg = `当前连接状态：\n`

      serverList.forEach((item) => {
        msg += '\n';
        msg += `┌ 服务器名称：${item.server_name}\n`;
        msg += `└ 连接状态：${activeSockets[item.server_name] ? '已连接' : '未连接'}\n`;
      })

      await e.reply(msg)
    } catch (error) {
      logger.error(error)
      await e.reply('查询失败，请检查配置文件')
    }

    return true
  }
}
