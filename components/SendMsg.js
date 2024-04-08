import Config from "./Config.js";

export default function sendMsg(message) {
    const config = Config.getConfig();
    const jsonMsg = JSON.parse(message);
    const displayServerName = config.mc_qq_display_server_name;
    let msg = displayServerName ? `[${jsonMsg.server_name}] ` : "";
    
    switch (jsonMsg.post_type) {
        case 'notice':
            msg += `${jsonMsg.player.nickname} `;
            switch (jsonMsg.sub_type) {
                case 'quit':
                    msg += `退出了游戏`;
                    break;
                case 'join':
                    msg += `加入了游戏`;
                    break;
                case 'death':
                    msg += `死了`;
                    break;
            }
            break;
        case 'message':
            msg += `${jsonMsg.player.nickname} 说：${jsonMsg.message}`;
            break;
    }

    const serverConfig = config.mc_qq_server_list.find(sConfig => sConfig.server_name === jsonMsg.server_name);

    if (serverConfig) {
        serverConfig.bot_self_id.forEach(botSelfID => {
            serverConfig.group_list.forEach(groupID => {
                try {
                    Bot[botSelfID].pickGroup(groupID).sendMsg(msg);
                    logger.info(`使用机器人 ${botSelfID} 发送消息到群 ${groupID}`);
                } catch (error) {
                    logger.error(`使用机器人 ${botSelfID} 发送消息到群 ${groupID} 失败`);
                }
            });
        });
    } else {
        logger.info(`服务器 ${jsonMsg.server_name} 未在配置文件中找到，忽略消息`);
    }
}