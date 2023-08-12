import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/Config.js'


export class Setting extends plugin {
  constructor() {
    super({
      name: 'QQ_MC',
      dsc: '配置参数',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '#?mc设置.*$',
        fnc: 'setting',
        permission: 'master'
      }]
    })

  }

  async setting(e) {
    var config = Config.getConfig()
    // 读取配置项
    let msg = e.msg.replace(/#?mc设置/, '').trim()
    // 如果为空则展示
    if (msg == '') {
        let str = [
            '===Minecraft插件配置===' + '\n' +
            'ws地址：' + config.mc_qq_ws_url + '\n' +
            'ws端口：' + config.mc_qq_ws_port + '\n' +
            'rcon状态：' + (config.rcon_enable ? '开启' : '关闭') + '\n' +
            'rcon地址：' + config.rcon_host + '\n' +
            'rcon端口：' + config.rcon_port + '\n' +
            'rcon密码：' + config.rcon_password + '\n' +
            '发送群名称：' + (config.mc_qq_send_group_name ? '是' : '否') + '\n' +
            '消息同步群：' + config.group_list
        ]
      e.reply(str, true)
      return true
    }
        
  }
}
