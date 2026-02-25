const whiteTextList = (text) => [{ text: String(text), color: 'white' }]

const textArg = (value) => String(value ?? '').trim()
const readText = (match, idx) => textArg(match?.[idx])

const buildActionbarRequest = (input) => {
  let barText = Array.isArray(input) ? readText(input, 1) : textArg(input)
  if (!barText) return { errorReply: '请输入要发送的动作栏内容' }

  return {
    api: 'send_actionbar',
    data: { message: whiteTextList(barText) }
  }
}

const buildPrivateRequest = (input) => {
  let targetName = Array.isArray(input) ? readText(input, 1) : textArg(input?.targetName)
  let targetText = Array.isArray(input) ? readText(input, 2) : textArg(input?.targetText)
  if (!targetName || !targetText) {
    return { errorReply: '请输入正确的私聊格式: #mc私聊 <玩家> <内容>' }
  }

  return {
    api: 'send_private_msg',
    data: { nickname: targetName, message: whiteTextList(targetText) }
  }
}

const buildTitleRequest = (input, key, emptyReply) => {
  let text = Array.isArray(input) ? readText(input, 1) : textArg(input)
  if (!text) return { errorReply: emptyReply }

  return {
    api: 'send_title',
    data: { [key]: { text, color: 'white' } }
  }
}

const buildBroadcastRequest = (input) => {
  let text = textArg(input)
  if (!text) return { errorReply: '请输入要广播的内容' }

  return {
    api: 'broadcast',
    data: { message: whiteTextList(text) }
  }
}

export { buildActionbarRequest, buildBroadcastRequest, buildPrivateRequest, buildTitleRequest }
