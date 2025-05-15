import YAML from 'yaml'
import fs from 'fs'
import { pluginRoot } from '../model/path.js'

const LOG_PREFIX_CONFIG = logger.blue('[Minecraft Config] ');

class Config {

  getConfig() {
    try {
      const config_data = YAML.parse(
        fs.readFileSync(`${pluginRoot}/config/config/config.yaml`, 'utf-8')
      )
      return config_data
    } catch (error) {
      logger.mark(LOG_PREFIX_CONFIG + ' 读取 config.yaml 失败' + error.message)
      return false
    }
  }

  getDefConfig() {
    try {
      const config_default_data = YAML.parse(
        fs.readFileSync(`${pluginRoot}/config/config_default.yaml`, 'utf-8')
      )
      return config_default_data
    } catch (error) {
      logger.mark(LOG_PREFIX_CONFIG + ' 读取 config_default.yaml 失败' + error.message)
      return false
    }
  }

  setConfig(config_data) {
    try {
      fs.writeFileSync(
        `${pluginRoot}/config/config/config.yaml`,
        YAML.stringify(config_data),
      )
      return true
    } catch (error) {
      logger.mark(LOG_PREFIX_CONFIG + ' 写入 config.yaml 失败' + error.message)
      return false
    }
  }
}

export default new Config()
