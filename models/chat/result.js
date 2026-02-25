import { isRecord, parseJson, toJson } from './common.js'

const formatCommandResult = (rawReply) => {
  if (rawReply === null || rawReply === undefined || rawReply === '') {
    return '命令执行成功'
  }

  if (typeof rawReply === 'string') {
    let parsed = parseJson(rawReply)
    return parsed ? formatCommandResult(parsed) : rawReply
  }

  if (!isRecord(rawReply)) return String(rawReply)

  if (rawReply.data !== null && rawReply.data !== undefined && rawReply.data !== '') {
    return typeof rawReply.data === 'string' ? rawReply.data : toJson(rawReply.data)
  }

  let status = String(rawReply.status || '').trim().toUpperCase()
  let text = String(rawReply.message || '').trim()
  if (status && status !== 'SUCCESS') return text || `命令执行失败 (${status})`
  return text || '命令执行成功'
}

export { formatCommandResult }