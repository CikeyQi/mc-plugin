import lodash from 'lodash'
import { execCommandSync } from './common.js'

const readRemoteText = (errMsg) => {
  let match = errMsg.match(/'(.+?)'/)
  return match?.[1] || 'unknown'
}

const checkGit = async (reply) => {
  try {
    let ret = execCommandSync('git --version')
    if (!ret || !ret.includes('git version')) {
      await reply('请先安装git')
      return false
    }
    return true
  } catch {
    await reply('请先安装git')
    return false
  }
}

const getCommitId = (plugin = '') => {
  let cm = `git -C ./plugins/${plugin}/ rev-parse --short HEAD`
  let commitId = execCommandSync(cm)
  return lodash.trim(commitId)
}

const getTime = (plugin = '') => {
  let cm = `cd ./plugins/${plugin}/ && git log -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`
  try {
    return lodash.trim(execCommandSync(cm))
  } catch (error) {
    logger.error(error.toString())
    return '获取时间失败'
  }
}

const getLogLines = (plugin = '') => {
  let cm = `cd ./plugins/${plugin}/ && git log -20 --oneline --pretty=format:"%h||[%cd]  %s" --date=format:"%m-%d %H:%M"`
  return execCommandSync(cm)
}

const replyGitError = async (reply, err, stdout) => {
  let msg = '更新失败：'
  let errMsg = err?.toString?.() || String(err || '')
  let outText = stdout?.toString?.() || String(stdout || '')

  if (errMsg.includes('Timed out')) {
    await reply(msg + `\n连接超时：${readRemoteText(errMsg)}`)
    return
  }

  if (/Failed to connect|unable to access/g.test(errMsg)) {
    await reply(msg + `\n连接失败：${readRemoteText(errMsg)}`)
    return
  }

  if (errMsg.includes('be overwritten by merge')) {
    await reply(
      msg +
      `存在冲突：\n${errMsg}\n` +
      '请解决冲突后再更新，或者执行 强制更新，放弃本地修改'
    )
    return
  }

  if (outText.includes('CONFLICT')) {
    await reply([
      msg + '存在冲突\n',
      errMsg,
      outText,
      '\n请解决冲突后再更新，或者执行 强制更新，放弃本地修改'
    ])
    return
  }

  await reply([errMsg, outText])
}

export { checkGit, getCommitId, getTime, getLogLines, replyGitError }