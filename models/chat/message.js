const toMcMessage = (e, config, serverItem) => {
  let list = []

  if (config?.mc_qq_send_group_name && e.group_name) {
    list.push({ text: `[${e.group_name}] `, color: 'aqua' })
  }

  let nick = e.sender?.nickname || e.sender?.card || String(e.user_id ?? '未知用户')
  let sayWord = config?.mc_qq_say_way || '说：'
  list.push({ text: nick, color: 'green' }, { text: ` ${sayWord} `, color: 'white' })

  let msgList = Array.isArray(e.message) ? e.message : [{ type: 'text', text: e.msg ?? '' }]

  for (let msgItem of msgList) {
    if (msgItem.type === 'text') {
      list.push({
        text: String(msgItem.text ?? '').replace(/\r/g, '').replace(/\n/g, '\n * '),
        color: 'white'
      })
      continue
    }

    if (msgItem.type === 'image') {
      let imageUrl = String(msgItem.url || '')
      if (serverItem?.mc_qq_chat_image_enable) {
        list.push({ text: `[[CICode,url=${imageUrl},name=图片]]` })
      } else {
        list.push({
          text: '[图片]',
          color: 'light_purple',
          hoverEvent: {
            action: 'show_text',
            value: { text: '点击跳转至浏览器查看', color: 'light_purple' }
          },
          clickEvent: { action: 'open_url', value: imageUrl }
        })
      }
      continue
    }

    list.push({ text: `[${msgItem.type}] ${msgItem.text || ''}`.trim(), color: 'white' })
  }

  return list
}

export { toMcMessage }