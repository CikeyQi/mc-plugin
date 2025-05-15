import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import RconManager from '../components/Rcon.js'
import Config from '../components/Config.js'

export class Setting extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MCQQ-设置同步',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '#?mc(开启|关闭)同步(.*)$',
          /** 执行方法 */
          fnc: 'setting',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '#?mc重连$',
          /** 执行方法 */
          fnc: 'reconnect',
          /** 主人权限 */
          permission: 'master'
        }
      ]
    })
  }

  async setting(e) {

    if (!e.group_id) {
      await e.reply('请在群内使用此功能')
      return true
    }

    const [_, operation, name] = e.msg.match(this.rule[0].reg)
    const server_name = name?.trim()

    if (!server_name) {
      await e.reply('请输入要同步的服务器名称，如 #mc开启同步Server1')
      return true
    }

    const config = Config.getConfig()
    if (!config.mc_qq_server_list.length) {
      await e.reply('请先在配置文件中添加服务器信息')
      return true
    }

    const index = config.mc_qq_server_list.findIndex(s => s.server_name === server_name)
    if (index === -1) {
      await e.reply(`未找到服务器「${server_name}」，发送[#mc状态]查看列表`);
      return true
    }
    const server = config.mc_qq_server_list[index]

    const isEnable = operation === '开启'

    if (isEnable) {
      server.group_list = [...new Set([...(server.group_list || []), e.group_id.toString()])]
      server.bot_self_id = [...new Set([...(server.bot_self_id || []), e.self_id.toString()])]
      server.rcon_able = true
      await e.reply(`✅ 已开启与 ${server_name} 的同步`)
    } else {
      server.group_list = (server.group_list || []).filter(g => g !== e.group_id.toString())
      server.bot_self_id = (server.bot_self_id || []).filter(id => id !== e.self_id.toString())
      server.rcon_able = !!server.group_list.length
      await e.reply(`⛔ 已关闭与 ${server_name} 的同步`)
    }

    Config.setConfig(config);
    return true
  }

  async reconnect(e) {
    await e.reply('正在重连全部已掉线服务器，请稍后...')

    await WebSocket._initializeAsync()
    await RconManager._initializeConnectionsAsync()

    return true
  }
}
