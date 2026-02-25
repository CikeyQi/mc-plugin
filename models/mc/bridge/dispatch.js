import { textOf, toError } from './utils.js'

const imageOf = (text) => {
  if (typeof text !== 'string') {
    return { text: String(text ?? ''), url: null }
  }

  let match = text.match(/\[\[CICode,.*?url=([^,\]]+).*?\]\]/i)
  return match
    ? { text: text.replace(/\[\[CICode,.*?\]\]/i, '').trim(), url: match[1] }
    : { text, url: null }
}

const sendGroupMessage = ({ messageText, serverItem, debugMode = false, logPrefix = '' }) => {
  let serverName = textOf(serverItem?.server_name) || '未知服务器'
  let botList = Array.isArray(serverItem?.bot_self_id) ? serverItem.bot_self_id.filter(Boolean).map(String) : []
  let groupList = Array.isArray(serverItem?.group_list) ? serverItem.group_list.filter(Boolean).map(String) : []

  if (!botList.length || !groupList.length) {
    if (debugMode) {
      logger.warn(logPrefix + `${serverName} 缺少 bot_self_id 或 group_list，忽略消息`)
    }
    return
  }

  let text = String(messageText ?? '')
  if (textOf(serverItem.mask_word)) {
    try {
      text = text.replace(new RegExp(serverItem.mask_word, 'g'), '')
    } catch {
      logger.warn(logPrefix + `${serverName} 的屏蔽词正则无效，已忽略`)
    }
  }

  text = text.trim()
  if (!text) return

  let { text: plainText, url: imageUrl } = imageOf(text)
  let imageSeg = imageUrl && global.segment ? segment.image(imageUrl) : null
  let payload = imageSeg ? [plainText, imageSeg] : plainText

  for (let botId of botList) {
    let bot = Bot?.[botId]
    if (!bot) {
      logger.error(logPrefix + `机器人 ${botId} 不存在或未登录，无法发送消息`)
      continue
    }

    for (let groupId of groupList) {
      try {
        bot.pickGroup(groupId).sendMsg(payload)
        if (debugMode) logger.info(logPrefix + `机器人 ${botId} 发送到群 ${groupId}`)
      } catch (error) {
        logger.error(logPrefix + `机器人 ${botId} 发送到群 ${groupId} 失败: ${toError(error)}`)
      }
    }
  }
}

export { sendGroupMessage }