import { Restart } from '../../../other/restart.js'
import { execCommand, updateState } from './common.js'
import { makeForwardMsg } from './forward.js'
import { checkGit, getCommitId, getLogLines, getTime, replyGitError } from './git.js'

class UpdateRunner {
  constructor (app) {
    this.app = app
    this.e = app.e
    this.isUp = false
    this.oldCommitId = ''
  }

  async reply (msg) {
    return this.app.reply(msg)
  }

  async update () {
    if (!this.e.isMaster) return false

    if (updateState.running) {
      await this.reply('已有命令更新中，请勿重复操作')
      return
    }

    if (!(await checkGit((msg) => this.reply(msg)))) {
      return
    }

    let isForce = this.e.msg.includes('强制')
    await this.runUpdate(isForce)

    if (this.isUp) {
      await this.reply('更新完毕，正在重启云崽以应用更新')
      setTimeout(() => this.restart(), 2000)
    }
  }

  restart () {
    new Restart(this.e).restart()
  }

  async runUpdate (isForce) {
    let command = 'git -C ./plugins/mc-plugin/ pull --no-rebase'
    if (isForce) {
      command = `git -C ./plugins/mc-plugin/ checkout . && ${command}`
      await this.e.reply('正在执行强制更新操作，请稍等')
    } else {
      await this.e.reply('正在执行更新操作，请稍等')
    }

    this.oldCommitId = getCommitId('mc-plugin')
    updateState.running = true
    let ret = await execCommand(command)
    updateState.running = false

    if (ret.error) {
      logger.mark(`${this.e.logFnc} 更新失败，mc-plugin`)
      await replyGitError((msg) => this.reply(msg), ret.error, ret.stdout)
      return false
    }

    let time = getTime('mc-plugin')

    if (/(Already up[ -]to[ -]date|已经是最新的)/.test(ret.stdout)) {
      await this.reply(`mc-plugin已经是最新版本\n最后更新时间：${time}`)
    } else {
      await this.reply(`mc-plugin\n最后更新时间：${time}`)
      this.isUp = true
      let log = await this.getLog('mc-plugin')
      await this.reply(log)
    }

    logger.mark(`${this.e.logFnc} 最后更新时间：${time}`)
    return true
  }

  async getLog (plugin = '') {
    let logAll
    try {
      logAll = getLogLines(plugin)
    } catch (error) {
      logger.error(error.toString())
      await this.reply(error.toString())
      return false
    }

    if (!logAll) return false

    let logList = logAll.split('\n')
    let logs = []
    for (let str of logList) {
      let item = str.split('||')
      if (item[0] === this.oldCommitId) break
      if (item[1]?.includes('Merge branch')) continue
      if (item[1]) logs.push(item[1])
    }

    let line = logs.length
    let text = logs.join('\n\n')
    if (!text.length) return ''

    let end = '更多详细信息，请前往github查看\nhttps://github.com/CikeyQi/mc-plugin/commits/main'
    return makeForwardMsg(this.e, `mc-plugin更新日志，共${line}条`, text, end)
  }
}

const runAppUpdate = async (app) => {
  let runner = new UpdateRunner(app)
  return runner.update()
}

export { UpdateRunner, runAppUpdate }