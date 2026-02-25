import { textOf } from './utils.js'

const namesOf = (client) => {
  if (!client?.list) return []

  try {
    let nameList = client.list()
    if (!Array.isArray(nameList)) return []
    return [...new Set(nameList.map((name) => textOf(name)).filter(Boolean))]
  } catch {
    return []
  }
}

const statusOf = (client) => {
  if (!client?.status) return []

  try {
    let statusList = client.status()
    if (!Array.isArray(statusList)) return []

    let statusMap = new Map()
    for (let statusItem of statusList) {
      let selfName = textOf(statusItem?.selfName)
      if (!selfName) continue

      let last = statusMap.get(selfName)
      statusMap.set(selfName, {
        selfName,
        open: Boolean(statusItem?.open) || Boolean(last?.open)
      })
    }

    return [...statusMap.values()]
  } catch {
    return []
  }
}

const namesForRoute = (client) => {
  let names = namesOf(client)
  if (names.length) return names
  return statusOf(client).map((item) => item.selfName)
}

const connectedNames = (bridge) => {
  let statusList = [
    ...statusOf(bridge.reverseClient),
    ...statusOf(bridge.forwardClient)
  ]

  let onlineList = statusList
    .filter((item) => item.open)
    .map((item) => item.selfName)

  if (statusList.length) return [...new Set(onlineList)].sort()

  return [...new Set([
    ...namesOf(bridge.reverseClient),
    ...namesOf(bridge.forwardClient)
  ])].sort()
}

const clientQueue = (bridge, serverName) => {
  let base = [bridge.reverseClient, bridge.forwardClient].filter(Boolean)
  let hit = base.filter((client) => namesForRoute(client).includes(serverName))
  return [...hit, ...base.filter((client) => !hit.includes(client))]
}

export { namesOf, statusOf, namesForRoute, connectedNames, clientQueue }