import plugin from "../../../lib/plugins/plugin.js";
import RconClient from "../components/Rcon.js";
import WebSocketCilent from "../components/WebSocket.js";
import Config from "../components/Config.js";

export class Title extends plugin {
  constructor() {
    super({
      name: "MC_QQ-Title",
      dsc: "标题发送标题",
      event: "message",
      priority: 1008,
      rule: [
        {
          reg: "#?mcst",
          fnc: "title",
        },
      ],
    });
  }

  async title(e) {
    if (!e.group_id) return false;
    const {
      mc_qq_server_list,
      debug_mode,
    } = await Config.getConfig();
    const { servers } = RconClient;
    const { connections } = WebSocketCilent;

    if (!mc_qq_server_list.length) return false;

    const serversList = mc_qq_server_list.filter((server) =>
      server.group_list.some((group) => group == e.group_id)
    );

    serversList.forEach(async (serverConfig, i) => {
      if (
        !servers[serverConfig.server_name] &&
        !connections[serverConfig.server_name]
      ) {
        if (debug_mode) {
          logger.mark(
            logger.blue("[Minecraft Client] ") +
              logger.green(serverConfig.server_name) +
              " 未连接"
          );
        }
        return false;
      }

      if (
        e.raw_message.startsWith(serverConfig.command_header) &&
        (serverConfig.command_user?.some((user) => user == e.user_id) ||
          e.isMaster)
      ) {
        if (!servers[serverConfig.server_name]) {
          await e.reply(
            `${serverConfig.server_name} 未连接，无法执行服务器命令`
          );
          return false;
        }

        const firstNewlineIndex = e.raw_message.indexOf('\n');

        let firstPart = e.raw_message;
        let secondPart = '';

        if (firstNewlineIndex !== -1) {
          firstPart = e.raw_message.substring(0, firstNewlineIndex);
          secondPart = e.raw_message.substring(firstNewlineIndex + 1);
        }

        let response = await servers[serverConfig.server_name].send(
          `${e.raw_message.replace(serverConfig.command_header, "")}`
        );

        if (debug_mode) {
          logger.mark(
            logger.blue("[Minecraft RCON Client] ") +
              "向 " +
              logger.green(serverConfig.server_name) +
              " 发送命令 " +
              e.raw_message.replace(serverConfig.command_header, "")
          );
        }

        if (response) {
          const mask_word = serverConfig.mask_word;
          response = response.replace(new RegExp(mask_word, "g"), "");

          await e.reply(response);
          if (debug_mode) {
            logger.mark(
              logger.blue("[Minecraft RCON Client] ") +
                logger.green(serversList[i].server_name) +
                " 返回消息 " +
                response
            );
          }
        }
      } else {
        let title = [
          {
            type: "text",
            data: {
              text: firstPart
            },
          },
        ];

        let subtitle = [
            {
              type: "text",
              data: {
                text: secondPart
              },
            },
        ]

        if (!connections[serverConfig.server_name]) {
          let text = messages.map((msg) => msg.text).join("");

          servers[serverConfig.server_name].send(
            `title @a title ${firstPart}`
          );
          servers[serverConfig.server_name].send(
            `title @a subtitle ${secondPart}`
          );

          if (debug_mode) {
            logger.mark(
              logger.blue("[Minecraft RCON Client] ") +
                "向 " +
                logger.green(serverConfig.server_name) +
                " 发送消息 " +
                text
            );
          }
        } else {
          connections[serverConfig.server_name].send(
            JSON.stringify({
              api: "send_title",
              data: {
                title: title,
                subtitle: subtitle,
              },
              echo: "1",
            })
          );

          if (debug_mode) {
            logger.mark(
              logger.blue("[Minecraft WebSocket] ") +
                "向 " +
                logger.green(serverConfig.server_name) +
                " 发送消息 " +
                messages
            );
          }
        }
      }
    });

    return false;
  }
}
