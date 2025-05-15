import Config from "./Config.js";

const formatMsg = (jsonData, showServer) => {
    let message = showServer ? `[${jsonData.server_name}] ` : "";
    const nickname = jsonData.player?.nickname;

    const messageHandlers = {
        'join': () => `${nickname} 加入了游戏`,
        'quit': () => `${nickname} 退出了游戏`,
        'death': () => jsonData.message,
        'player_command': () => `${nickname} 使用命令 ${jsonData.message}`,
        'achievement': () => {
            if (!jsonData.advancement?.display?.title) return null;
            return `${nickname} 达成了进度 ${jsonData.advancement.display.title}`;
        },
        'chat': () => {
            const { mc_qq_say_way: sayConnector } = Config.getConfig();
            return `${nickname} ${sayConnector} ${jsonData.message}`;
        }
    };

    const handler = messageHandlers[jsonData.sub_type];

    if (handler) {
        const subMessage = handler();
        return subMessage === null ? null : message + subMessage;
    } else {
        logger.info(`服务器 ${jsonData.server_name} 的未知的上报类型 ${jsonData.sub_type}`);
        return null;
    }
};

export default function processAndSend(rawMessage) {
    const { mc_qq_display_server_name: showServer, mc_qq_server_list: serverList } = Config.getConfig();
    let jsonData;

    try {
        jsonData = JSON.parse(rawMessage);
    } catch (error) {
        logger.error(`解析消息失败: ${error.message}. 原始消息: ${rawMessage}`);
        return;
    }

    let messageContent = formatMsg(jsonData, showServer);

    if (!messageContent) return;

    const serverCfg = serverList.find(s => s.server_name === jsonData.server_name);

    if (serverCfg) {
        const { bot_self_id: botIds, group_list: groupIds, mask_word: censorWord } = serverCfg;

        if (censorWord) {
            messageContent = messageContent.replace(new RegExp(censorWord, "g"), '');
        }

        if (!botIds || botIds.length === 0) {
            logger.error(`服务器 ${jsonData.server_name} 未配置推送机器人ID，忽略消息`);
            return;
        }

        botIds.forEach(botId => groupIds.forEach(groupId => {
            try {
                console.log(messageContent)
                const [, url] = messageContent.match(/\[\[CICode,.*?url=([^,$$]+).*?\]\]/) || [];
                console.log(url)
                const msg = url ? [messageContent.replace(/\[\[CICode,.*?\]\]/, '').trim(), segment.image(url)] : messageContent;
                Bot[botId].pickGroup(groupId).sendMsg(msg);
                logger.info(`机器人 ${botId} 发送到群 ${groupId}${url ? ' (含图片)' : ''}`);
            } catch (e) {
                logger.error(`机器人 ${botId} 发送到群 ${groupId} 失败: ${e.message}`);
            }
        }));
    } else {
        logger.info(`服务器 ${jsonData.server_name} 未在配置文件中找到，忽略消息`);
    }
}