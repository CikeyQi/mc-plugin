const asText = (msg) => {
  if (Array.isArray(msg)) {
    return msg.map((item) => String(item)).join('\n')
  }
  return String(msg ?? '')
}

const makeForwardMsg = async (e, title, msg, end) => {
  let nickname = (e.bot ?? Bot).nickname
  if (e.isGroup) {
    let info = await (e.bot ?? Bot).getGroupMemberInfo(e.group_id, (e.bot ?? Bot).uin)
    nickname = info.card || info.nickname
  }

  let userInfo = {
    user_id: (e.bot ?? Bot).uin,
    nickname
  }

  let forwardMsg = [
    { ...userInfo, message: title },
    { ...userInfo, message: msg }
  ]

  if (end) {
    forwardMsg.push({ ...userInfo, message: end })
  }

  if (e.group?.makeForwardMsg) {
    forwardMsg = await e.group.makeForwardMsg(forwardMsg)
  } else if (e?.friend?.makeForwardMsg) {
    forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
  } else {
    return asText(msg)
  }

  let dec = 'mc-plugin 更新日志'
  if (typeof forwardMsg.data === 'object') {
    let detail = forwardMsg.data?.meta?.detail
    if (detail) {
      detail.news = [{ text: dec }]
    }
  } else {
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${dec}</title>`)
  }

  return forwardMsg
}

export { makeForwardMsg }