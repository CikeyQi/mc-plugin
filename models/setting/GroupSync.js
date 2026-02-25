const cleanName = (inputText) => String(inputText || '').trim()

const syncGroup = (serverItem, groupId, selfId, isEnable) => {
  let groupList = Array.isArray(serverItem.group_list) ? serverItem.group_list.map(String) : []
  let botList = Array.isArray(serverItem.bot_self_id) ? serverItem.bot_self_id.map(String) : []

  if (isEnable) {
    serverItem.group_list = [...new Set([...groupList, groupId])]
    serverItem.bot_self_id = [...new Set([...botList, selfId])]
    return
  }

  serverItem.group_list = groupList.filter((item) => item !== groupId)
  serverItem.bot_self_id = botList.filter((item) => item !== selfId)
}

const findServerByName = (config, serverName) => {
  let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
  return serverList.find((item) => cleanName(item.server_name) === cleanName(serverName)) || null
}

export { cleanName, syncGroup, findServerByName }