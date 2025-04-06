import plugin from '../../../lib/plugins/plugin.js'
import WebSocket from '../components/WebSocket.js'
import RconClient from '../components/Rcon.js'
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

      // "??=" 的意思是若前面的变量不存在( undefind )则赋为后面的值
      server.group_list ??= [];
      server.bot_self_id ??= [];

      // 逻辑语法，"||" 的意思是前面为假才运行后面判断是否为真，在这里是需要前面为假时运行后面，刚好合适
      server.group_list.some(g => g === e.group_id.toString()) ||
        server.group_list.push(e.group_id.toString());
      server.bot_self_id.some(id => id === e.self_id.toString()) ||
        server.bot_self_id.push(e.self_id.toString());

      server.rcon_able = true; // 这里其实用不到判断原值是啥

      await e.reply(`本群已开启与${server_name}的同步`);

    } else if (e.msg.includes('关闭')) {

      const index = server.group_list.findIndex(group => group == e.group_id);
      if (index > -1) {
        server.group_list.splice(index, 1);
      }

      const index2 = server.bot_self_id.findIndex(id => id == e.self_id);
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

  async reconnect(e) {
    await e.reply('正在重连全部已掉线服务器，请稍后...')

    await WebSocket.connectWebSocket()
    await RconClient.initRconClient()

    return true
  }
}
