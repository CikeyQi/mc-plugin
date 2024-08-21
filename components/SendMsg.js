import Config from "./Config.js";

const getNoticeMessage = (nickname, subType) => {
    const noticeTypes = {
        quit: '退出了游戏',
        join: '加入了游戏',
        death: '死了'
    };
    return `${nickname} ${noticeTypes[subType] || ''}`;
}

const getMessageMessage = (nickname, sub_type, msg) => {
    if (sub_type === 'chat')
        return `${nickname} ${Config.getConfig().mc_qq_say_way} ${msg}`;
    if (sub_type === 'death')
        return msg;
    if (sub_type === 'player_command')
        return `${nickname} 使用命令 ${msg}`;
}

const getMessage = ({ server_name, post_type, player, message, sub_type }, displayServerName) => {
    let msg = displayServerName ? `[${server_name}] ` : "";

    switch (post_type) {
        case 'notice':
            msg += getNoticeMessage(player.nickname, sub_type);
            break;
        case 'message':
            msg += getMessageMessage(player.nickname, sub_type, message);
            break;
    }

    return msg;
}

export default function sendMsg(message) {
    const { mc_qq_display_server_name, mc_qq_server_list } = Config.getConfig();
    const jsonMsg = JSON.parse(message);
    let msg = getMessage(jsonMsg, mc_qq_display_server_name);

    const serverConfig = mc_qq_server_list.find(({ server_name }) => server_name === jsonMsg.server_name);

    if (serverConfig) {
        const { bot_self_id, group_list, mask_word } = serverConfig;

        msg = msg.replace(new RegExp(mask_word, "g"), '');

        if (!bot_self_id) return logger.error(`服务器 ${jsonMsg.server_name} 未配置推送机器人ID，忽略消息`);

        bot_self_id.forEach(botID => {
            group_list.forEach(groupID => {
                try {
                    Bot[botID].pickGroup(groupID).sendMsg(msg);
                    logger.info(`使用机器人 ${botID} 发送消息到群 ${groupID}`);
                } catch (error) {
                    logger.error(`使用机器人 ${botID} 发送消息到群 ${groupID} 失败：${error.message}`);
                }
            });
        });
    } else {
        logger.info(`服务器 ${jsonMsg.server_name} 未在配置文件中找到，忽略消息`);
    }
}