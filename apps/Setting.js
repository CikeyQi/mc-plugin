import plugin from '../../../lib/plugins/plugin.js'
import Log from '../utils/logs.js'
import Config from '../components/Config.js'
import Init from '../model/init.js'

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
    Init.initConfig()
    // 读取配置项
    var config = Config.getConfig()
    const keyParam = /((ws|rcon)(路由|端口|状态|地址|密码)|群名显示|同步)/g.exec(e.msg)
    const key = keyParam ? keyParam[1] : ''
    let value = e.msg.replace(/#?mc设置/, '').replace(new RegExp(`${key}`), '').trim()
    // key匹配失败,value存在时
    if (key === '' && value != '') {
      e.reply(`配置项不存在,请检查输入`)
      return true
    }
    // 修改标志位,修改成功后修改为true
    let alterFlag = false
    switch (key) {
      case 'ws路由':
        if (value.startsWith('/')) {
          config.mc_qq_ws_url = value
          alterFlag = true
        } else {
          e.reply('请输入正确的路由地址,格式为\n#mc设置ws路由/yz/v3/mcqq',true)
          return true
        }
        break
      case 'ws端口':
        config.mc_qq_ws_port = Number(value)
        alterFlag = true
        break
      case 'rcon状态':
        if (value.match(/(开启|关闭)/)) {
          if (value === '开启') {
            config.rcon_enable = true
          } else if (value === '关闭') {
            config.rcon_enable = false
          }
          alterFlag = true
        }
        break
      case 'rcon地址':
        Log.e(value)
        if (!/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
          e.reply('请输入正确的ip地址,格式为\n#mc设置rcon地址127.0.0.1', true)
          return true
        } else {
          config.rcon_host = value
          alterFlag = true
        }
        break
      case 'rcon端口':
        config.rcon_port = Number(value)
        alterFlag = true
        break
      case 'rcon密码':
        config.rcon_password = value
        alterFlag = true
        break
      case '群名显示':
        if (value.match(/(开启|关闭)/)) {
          if (value === '开启') {
            config.mc_qq_send_group_name = true
          } else if (value === '关闭') {
            config.mc_qq_send_group_name = false
          }
          alterFlag = true
        }
        break
      case '同步':
        // 如果值存在,找到该值的索引
        const index = config['group_list'].indexOf(Number(e.group_id))
        if (value.match(/(开启|关闭)/)) {
          if (value === '开启') {
            if (index > -1) {
              e.reply(`${e.group.name}(${e.group_id})群与服务器消息同步已开启`, true)
              return true
            } else {
              config['group_list'].push(Number(e.group_id))
              alterFlag = true
            }
          } else if (value === '关闭') {
            if (index > -1) {
              config['group_list'].splice(index, 1)
              alterFlag = true
            } else {
              e.reply(`${e.group.name}(${e.group_id})群与服务器消息同步已关闭`, true)
              return true
            }
          }
        }
        break
      default:
        // 如果key为空且value为空则展示
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
    if (alterFlag) {
      try {
        await Config.setConfig(config)
        let msg = [
          key.match(/(路由|端口|地址|密码)/) ? `设置项${key}已修改为${value}`
            : key === '群名显示' || key === 'rcon状态' ? `设置项${key}已${value}`
              : key === '同步' ? `${e.group.name}(${e.group_id})与服务器消息同步已${value}`
                : "???"
        ]
        Log.i('更新配置项', key, value)
        e.reply(msg, true)
      } catch (err) {
        Log.e(err)
        Log.e(err.message)
        return this.e.reply("设置失败。请查看控制台报错", true)
      }
      return true
    } else {
      e.reply(`设置项${key}无法修改为${value}`, true)
    }
  }
}
