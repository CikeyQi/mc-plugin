import { isRecord, parseJson, textOf } from './utils.js'

const walkText = (node) => {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return String(node)
  if (Array.isArray(node)) return node.map(walkText).join('')
  if (!isRecord(node)) return ''

  return [
    typeof node.text === 'string' ? node.text : '',
    typeof node.translate === 'string' ? node.translate : '',
    typeof node.key === 'string' ? node.key : '',
    Array.isArray(node.extra) ? node.extra.map(walkText).join('') : '',
    Array.isArray(node.with) ? node.with.map(walkText).join('') : ''
  ].join('')
}

const plainRaw = (raw) => {
  if (raw === null || raw === undefined) return ''
  if (typeof raw !== 'string') return walkText(raw)

  let text = raw.trim()
  if (!text.startsWith('{') && !text.startsWith('[')) return raw

  let parsed = parseJson(text)
  let plain = parsed ? walkText(parsed) : ''
  return plain || raw
}

const resolveEventData = (eventData) => {
  let rawEvent = isRecord(eventData)
    ? (isRecord(eventData.data) && (
      'post_type' in eventData.data ||
      'event_name' in eventData.data ||
      'sub_type' in eventData.data
    ) ? eventData.data : eventData)
    : eventData

  return parseJson(rawEvent)
}

const formatEvent = (eventData, config) => {
  let postType = textOf(eventData.post_type)
  if (postType && postType !== 'message' && postType !== 'notice') return null

  let playerName = textOf(eventData.player?.nickname) || '未知玩家'
  let sayWord = textOf(config?.mc_qq_say_way) || '说：'

  let builders = {
    player_join: () => `${playerName} 加入了游戏`,
    player_quit: () => `${playerName} 退出了游戏`,
    player_death: () => textOf(eventData.death?.text) || textOf(eventData.death?.translate?.text) || `${playerName} 死亡了`,
    player_command: () => `${playerName} 使用命令 ${textOf(eventData.command)}`.trim(),
    player_achievement: () => {
      let title = textOf(eventData.achievement?.translate?.text)
        || textOf(eventData.achievement?.text)
        || textOf(eventData.achievement?.display?.title?.text)
        || textOf(eventData.achievement?.display?.title?.translate?.text)
        || textOf(eventData.achievement?.display?.title)
      if (!title) return null
      if (textOf(eventData.achievement?.translate?.text) || textOf(eventData.achievement?.text)) return title
      return `${playerName} 达成了进度 ${title}`
    },
    player_chat: () => {
      let content = textOf(eventData.message) || textOf(plainRaw(eventData.raw_message))
      return content ? `${playerName} ${sayWord} ${content}`.trim() : null
    }
  }

  let makeText = builders[eventData.sub_type]
  if (!makeText) return null

  let body = makeText()
  if (!body) return null

  if (!config?.mc_qq_display_server_name) return body
  let serverName = textOf(eventData.server_name) || '未知服务器'
  return `[${serverName}] ${body}`
}

export { resolveEventData, formatEvent }