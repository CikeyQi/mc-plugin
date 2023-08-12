import fs from 'fs'
import { pluginRoot } from '../model/path.js'
import Log from '../utils/logs.js'

class Init {
  constructor () {
    this.initConfig()
  }

  initConfig () {
    const config_default_yaml = `${pluginRoot}/config/config_default.yaml`
    if (!fs.existsSync(config_default_yaml)) {
      Log.e('默认设置文件不存在，请检查或重新安装插件')
      return true
    }
    const config_yaml = `${pluginRoot}/config/config/config.yaml`
    if (!fs.existsSync(config_yaml)) {
      Log.e('设置文件不存在，将使用默认设置文件')
      fs.copyFileSync(config_default_yaml, config_yaml)
    }
  }
}

export default new Init()
