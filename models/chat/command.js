const readCommandName = (commandText) => {
  let text = String(commandText ?? '').trim()
  if (!text) return ''
  let [name = ''] = text.split(/\s+/, 1)
  return name.trim()
}

const allowWhitelistCommand = (serverItem, commandText) => {
  let commandName = readCommandName(commandText)
  if (!commandName) return false

  let whitelist = Array.isArray(serverItem?.rcon_command_whitelist)
    ? serverItem.rcon_command_whitelist
    : []

  return whitelist.some((item) => {
    return String(item ?? '').trim().replace(/^\/+/, '') === commandName
  })
}

const allowCommand = (serverItem, e, commandText) => {
  if (e.isMaster) return true
  if (allowWhitelistCommand(serverItem, commandText)) return true

  let userList = Array.isArray(serverItem?.command_user) ? serverItem.command_user : []
  return userList.some((userItem) => String(userItem) === String(e.user_id))
}

const readCommand = (msgText, serverItem) => {
  let text = String(msgText ?? '')
  let head = String(serverItem?.command_header || '/')
  return head && text.startsWith(head) ? text.slice(head.length).trim() : null
}

export { readCommandName, allowWhitelistCommand, allowCommand, readCommand }