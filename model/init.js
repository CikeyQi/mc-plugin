import fs from 'fs'
import path from 'path'
import Config from '../components/Config.js'
import { pluginRoot } from '../model/path.js'

const LOG_PREFIX_INIT = logger.blue('[Minecraft Initialize] ');

class ConfigManager {
  constructor() {
    this.configDir = path.join(pluginRoot, 'config')
    this.defaultConfigPath = path.join(this.configDir, 'config_default.yaml')
    this.userConfigPath = path.join(this.configDir, 'config', 'config.yaml')
  }

  initialize() {
    try {
      this.ensureDefaultConfigExists()
      this.createUserConfigIfMissing()
      this.synchronizeConfig()
    } catch (error) {
      logger.mark(LOG_PREFIX_INIT + ' 初始化失败' + error.message)
      throw error
    }
  }

  ensureDefaultConfigExists() {
    if (!fs.existsSync(this.defaultConfigPath)) {
      throw new Error('默认设置文件不存在，请检查或重新安装插件')
    }
  }

  createUserConfigIfMissing() {
    const userConfigDir = path.dirname(this.userConfigPath)
    
    try {
      if (!fs.existsSync(this.userConfigPath)) {
        logger.mark(LOG_PREFIX_INIT + ' 配置文件不存在，将使用默认设置文件')
        fs.mkdirSync(userConfigDir, { recursive: true })
        fs.copyFileSync(this.defaultConfigPath, this.userConfigPath)
      }
    } catch (error) {
      throw new Error(`配置文件创建失败: ${error.message}`)
    }
  }

  synchronizeConfig() {
    const defaultConfig = Config.getDefConfig()
    const userConfig = Config.getConfig()

    // 合并默认配置到用户配置
    Object.entries(defaultConfig).forEach(([key, value]) => {
      if (!(key in userConfig)) {
        userConfig[key] = value
      }
    })

    // 清理无效配置项
    const userKeys = Object.keys(userConfig)
    const validKeys = new Set(Object.keys(defaultConfig))
    userKeys.forEach(key => {
      if (!validKeys.has(key)) {
        delete userConfig[key]
      }
    })

    Config.setConfig(userConfig)
  }
}

class Init {
  constructor() {
    this.configManager = new ConfigManager()
    this.configManager.initialize()
  }
}

export default new Init()