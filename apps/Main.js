import plugin from '../../../lib/plugins/plugin.js'
import RconClient from '../components/Rcon.js'
import WebSocketCilent from '../components/WebSocket.js'
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
    const { mc_qq_send_group_name, mc_qq_say_way, mc_qq_chat_image_enable, mc_qq_server_list, debug_mode } = await Config.getConfig();
    const { servers } = RconClient
    const { connections } = WebSocketCilent

    if (!mc_qq_server_list.length) return false

    const serversList = mc_qq_server_list.filter(server => server.group_list.some(group => group == e.group_id))

    serversList.forEach(async (serverConfig, i) => {
      if (!servers[serverConfig.server_name] && !connections[serverConfig.server_name]) {
        if (debug_mode) {
          logger.mark(
            logger.blue('[Minecraft Client] ') +
            logger.green(serverConfig.server_name) +
            ' 未连接'
          )
        }
        return false
      }

      if (e.raw_message.startsWith(serverConfig.command_header) && (serverConfig.command_user?.some(user => user == e.user_id) || e.isMaster)) {

        if (!servers[serverConfig.server_name]) {
          await e.reply(`${serverConfig.server_name} 未连接，无法执行服务器命令`)
          return false
        }

        let response = await servers[serverConfig.server_name].send(`${e.raw_message.replace(serverConfig.command_header, '')}`);

        if (debug_mode) {
          logger.mark(
            logger.blue('[Minecraft RCON Client] ') + '向 ' +
            logger.green(serverConfig.server_name) +
            ' 发送命令 ' + e.raw_message.replace(serverConfig.command_header, '')
          )
        }

        if (response) {
          const mask_word = serverConfig.mask_word;
          response = response.replace(new RegExp(mask_word, "g"), '');

          await e.reply(response);
          if (debug_mode) {
            logger.mark(
              logger.blue('[Minecraft RCON Client] ') +
              logger.green(serversList[i].server_name) +
              ' 返回消息 ' + response
            )
          }
        }
      } else {

        let messages = [{
          type: "text",
          data: {text: `${mc_qq_send_group_name ? `[${e.group_name}] ` : ""}[${e.sender.nickname}] ` + mc_qq_say_way,}
        }];

        e.message.forEach(element => {
          let msg = {};
          if (element.type === 'text') {
            msg = {type: "text", data: { text: element.text.replace("\r", "").replace("\n", "\n * "), color: "white" }};
          } else if (element.type === 'image') {
            if (mc_qq_chat_image_enable) {
              msg = {type:"text", data: { text: `[[CICode,url=${element.url},name=图片]]` }};
            } else {
              msg = {type:"text", data: { text: `[图片]`, color: "aqua", click_event: { action: "open_url", value: element.url } }};
            }
          } else {
            msg = {type:"text", data:{ text: element.text || "" }}
          }
          messages.push(msg);
        });

        if (!connections[serverConfig.server_name]) {

          let text = messages.map(msg => msg.text).join('');

          servers[serverConfig.server_name].send(`tellraw @a {"text":"${text}"}`);

          if (debug_mode) {
            logger.mark(
              logger.blue('[Minecraft RCON Client] ') + '向 ' +
              logger.green(serverConfig.server_name) +
              ' 发送消息 ' + text
            )
          }

        } else {

          connections[serverConfig.server_name].send(JSON.stringify({
            api: "broadcast",
            data: {
              message: messages,
            }
          }));

          if (debug_mode) {
            logger.mark(
              logger.blue('[Minecraft WebSocket] ') + '向 ' +
              logger.green(serverConfig.server_name) +
              ' 发送消息 ' + messages
            )
          }

        }
      }
    })

    return false
  }
}