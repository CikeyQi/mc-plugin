import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { defaultConfigPath, userConfigPath } from './paths.js'
import { normalizeConfig } from './normalize.js'
import { LOG_PREFIX_CONFIG, LOG_PREFIX_INIT } from '../logging/prefixes.js'

let cachedConfig = null
let cachedMtimeMs = 0
let cachedDefaults = null

function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function readYaml (filePath) {
  try {
    let raw = fs.readFileSync(filePath, 'utf-8')
    let parsed = YAML.parse(raw)
    return isPlainObject(parsed) ? parsed : {}
  } catch (error) {
    logger.mark(LOG_PREFIX_CONFIG + `读取 ${filePath} 失败: ${error.message}`)
    return null
  }
}

function writeYamlAtomic (filePath, data) {
  let dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  let tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, YAML.stringify(data), 'utf-8')
  fs.renameSync(tmpPath, filePath)
}

function mergeDefaults (userConfig, defaultConfig) {
  if (!isPlainObject(userConfig)) return defaultConfig

  let merged = { ...userConfig }
  Object.keys(defaultConfig || {}).forEach((key) => {
    let userValue = merged[key]
    let defaultValue = defaultConfig[key]

    if (userValue === undefined) {
      merged[key] = defaultValue
      return
    }

    if (isPlainObject(userValue) && isPlainObject(defaultValue)) {
      merged[key] = mergeDefaults(userValue, defaultValue)
    }
  })

  return merged
}

function stripUnknownKeys (config, defaultConfig) {
  if (!isPlainObject(config) || !isPlainObject(defaultConfig)) return config

  let cleaned = {}
  Object.keys(defaultConfig).forEach((key) => {
    if (config[key] === undefined) return

    let value = config[key]
    let defaultValue = defaultConfig[key]
    cleaned[key] = isPlainObject(value) && isPlainObject(defaultValue)
      ? stripUnknownKeys(value, defaultValue)
      : value
  })

  return cleaned
}

function ensureDefaultConfigExists () {
  if (!fs.existsSync(defaultConfigPath)) {
    throw new Error('默认设置文件不存在，请检查或重新安装插件')
  }
}

function ensureUserConfigExists () {
  let userConfigDir = path.dirname(userConfigPath)
  if (!fs.existsSync(userConfigPath)) {
    logger.mark(LOG_PREFIX_INIT + ' 配置文件不存在，将使用默认设置文件')
    fs.mkdirSync(userConfigDir, { recursive: true })
    fs.copyFileSync(defaultConfigPath, userConfigPath)
  }
}

function loadDefaults () {
  if (cachedDefaults) return cachedDefaults

  ensureDefaultConfigExists()
  let defaults = readYaml(defaultConfigPath) || {}
  cachedDefaults = defaults
  return defaults
}

function loadConfigFromDisk () {
  let defaults = loadDefaults()
  let userConfig = readYaml(userConfigPath)
  if (!userConfig) {
    return normalizeConfig({ ...defaults }, defaults)
  }

  let merged = mergeDefaults(userConfig, defaults)
  let cleaned = stripUnknownKeys(merged, defaults)
  return normalizeConfig(cleaned, defaults)
}

function refreshCache (force = false) {
  let mtimeMs = 0

  try {
    if (!fs.existsSync(userConfigPath)) {
      ensureDefaultConfigExists()
      ensureUserConfigExists()
    }
    let stats = fs.statSync(userConfigPath)
    mtimeMs = stats.mtimeMs
  } catch {
    mtimeMs = 0
  }

  if (!force && cachedConfig && cachedMtimeMs === mtimeMs) {
    return cachedConfig
  }

  cachedConfig = loadConfigFromDisk()
  cachedMtimeMs = mtimeMs
  return cachedConfig
}

const ConfigService = {
  initialize () {
    ensureDefaultConfigExists()
    ensureUserConfigExists()

    let defaults = loadDefaults()
    let config = loadConfigFromDisk()
    writeYamlAtomic(userConfigPath, config)
    cachedConfig = config

    try {
      cachedMtimeMs = fs.statSync(userConfigPath).mtimeMs
    } catch {
      cachedMtimeMs = 0
    }

    return { defaults, config }
  },

  getConfig () {
    return refreshCache(false)
  },

  getDefConfig () {
    return loadDefaults()
  },

  setConfig (configData) {
    try {
      let defaults = loadDefaults()
      let normalized = normalizeConfig(configData, defaults)
      writeYamlAtomic(userConfigPath, normalized)
      cachedConfig = normalized

      try {
        cachedMtimeMs = fs.statSync(userConfigPath).mtimeMs
      } catch {
        cachedMtimeMs = 0
      }

      return true
    } catch (error) {
      logger.mark(LOG_PREFIX_CONFIG + `写入 config.yaml 失败: ${error.message}`)
      return false
    }
  },

  reloadConfig () {
    return refreshCache(true)
  }
}

export default ConfigService