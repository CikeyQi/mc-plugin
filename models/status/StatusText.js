const renderStatusText = (config, onlineNameList = []) => {
  let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
  let onlineSet = new Set(onlineNameList)

  let textList = ['当前连接状态：']
  for (let serverItem of serverList) {
    let serverName = String(serverItem.server_name || '未命名')
    textList.push('')
    textList.push(`- 服务器名称：${serverName}`)
    textList.push(`- 连接状态：${onlineSet.has(serverName) ? '已连接' : '未连接'}`)
  }

  return textList.join('\n')
}

export { renderStatusText }