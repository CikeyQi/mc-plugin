import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/Config.js'
import Init from '../model/init.js'

export class Setting extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MC_QQ-设置',
      /** 功能描述 */
      dsc: '设置插件',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '#?mc(开启|关闭)同步.*$',
          /** 执行方法 */
          fnc: 'setting',
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

    Init.initConfig()
    var config = Config.getConfig()

    if (!config.mc_qq_server_list.length) {
      await e.reply('请自行在配置文件中添加服务器相关信息再使用此功能')
      return true
    }

    let server_name = e.msg.replace(/#?mc(开启|关闭)同步/, '').trim()

    if (!server_name) {
      await e.reply('请输入服务器名称，发送[#mc状态]即可查看所有服务器名称')
      return true
    }

    const server = config.mc_qq_server_list.find(s => s.server_name === server_name);

    if (!server) {
      await e.reply(`未找到名称为${server_name}的服务器，发送[#mc状态]即可查看所有服务器名称`);
      return true
    }

    if (e.msg.includes('开启')) {

      if (!server.group_list.includes(e.group_id)) {
        server.group_list.push(e.group_id);
      }

      if (!server.bot_self_id.includes(e.self_id)) {
        server.bot_self_id.push(e.self_id);
      }

      if (!server.rcon_able) {
        server.rcon_able = true;
      }

      await e.reply(`本群已开启与${server_name}的同步`);

    } else if (e.msg.includes('关闭')) {

      const index = server.group_list.indexOf(e.group_id);
      if (index > -1) {
        server.group_list.splice(index, 1);
      }

      const index2 = server.bot_self_id.indexOf(e.self_id);
      if (index2 > -1) {
        server.bot_self_id.splice(index2, 1);
      }

      if (!server.group_list.length) {
        server.rcon_able = false;
      }

      Config.setConfig(config);
      await e.reply(`本群已关闭与${server_name}的同步`);

    }
    config.mc_qq_server_list[config.mc_qq_server_list.findIndex(s => s.server_name === server_name)] = server;
    Config.setConfig(config);
    return true
  }
}
