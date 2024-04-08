import plugin from '../../../lib/plugins/plugin.js'
import RconClient from '../components/Rcon.js'

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
    return false
  }
}