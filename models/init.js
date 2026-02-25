import Config from '../components/Config.js'
import { LOG_PREFIX_INIT } from '../components/logging/prefixes.js'

const Init = {
  inited: false,

  init () {
    if (Init.inited) {
      return true
    }

    try {
      Config.initialize()
      Init.inited = true
      return true
    } catch (error) {
      logger.mark(LOG_PREFIX_INIT + ' 初始化失败: ' + error.message)
      throw error
    }
  }
}

export default Init
