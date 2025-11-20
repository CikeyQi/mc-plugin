const responseMap = {}
export function addResponse(echo, e, timeoutMs = 5000) {
    if (!echo || !e) return;
    responseMap[echo] = e;
    setTimeout(() => {
        if (responseMap[echo]) {
            logger.warn(`[MC-PLUGIN] 命令响应超时: echo=${echo}`);
            delete responseMap[echo];
        }
    }, timeoutMs);
}

export function handleResponse(echo, msgObj) {
    const e = responseMap[echo];
    if (!e) return false;
    delete responseMap[echo];
    let msg = '';
    try {
        let res = msgObj;
        if (typeof msgObj === 'string') {
            try { res = JSON.parse(msgObj); } catch { res = msgObj; }
        }
        if (typeof res === 'object' && res !== null && res.post_type === 'response') {
            msg = String(res.data ?? res.message ?? JSON.stringify(res));
        } else if (typeof res === 'object' && res !== null) {
            if ('data' in res) {
                msg = String(res.data);
            } else if ('message' in res) {
                msg = String(res.message);
            } else {
                msg = JSON.stringify(res);
            }
            if ('status' in res) {
                msg = `[${res.status}] ` + msg;
            }
            if ('code' in res) {
                msg = `[code=${res.code}] ` + msg;
            }
        } else {
            msg = String(res);
        }
        e.reply(msg.trim());
    } catch (err) {
        logger.error(`[MC-PLUGIN] 发送响应消息失败: echo=${echo}, err=${err.message}`);
    }
    return true;
}
