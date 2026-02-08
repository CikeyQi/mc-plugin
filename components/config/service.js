import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { defaultConfigPath, userConfigPath } from './paths.js';
import { normalizeConfig } from './normalize.js';
import { LOG_PREFIX_CONFIG, LOG_PREFIX_INIT } from '../logging/prefixes.js';

let cachedConfig = null;
let cachedMtimeMs = 0;
let cachedDefaults = null;

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function readYaml(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = YAML.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch (error) {
    logger.mark(LOG_PREFIX_CONFIG + `读取 ${filePath} 失败: ${error.message}`);
    return null;
  }
}

function writeYamlAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, YAML.stringify(data), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function mergeDefaults(userConfig, defaultConfig) {
  if (!isPlainObject(userConfig)) return defaultConfig;
  const merged = { ...userConfig };
  Object.keys(defaultConfig || {}).forEach((key) => {
    const userValue = merged[key];
    const defaultValue = defaultConfig[key];
    if (userValue === undefined) {
      merged[key] = defaultValue;
      return;
    }
    if (isPlainObject(userValue) && isPlainObject(defaultValue)) {
      merged[key] = mergeDefaults(userValue, defaultValue);
    }
  });
  return merged;
}

function stripUnknownKeys(config, defaultConfig) {
  if (!isPlainObject(config) || !isPlainObject(defaultConfig)) return config;
  const cleaned = {};
  Object.keys(defaultConfig).forEach((key) => {
    if (config[key] === undefined) return;
    const value = config[key];
    const defaultValue = defaultConfig[key];
    cleaned[key] = isPlainObject(value) && isPlainObject(defaultValue)
      ? stripUnknownKeys(value, defaultValue)
      : value;
  });
  return cleaned;
}

function ensureDefaultConfigExists() {
  if (!fs.existsSync(defaultConfigPath)) {
    throw new Error('默认设置文件不存在，请检查或重新安装插件');
  }
}

function ensureUserConfigExists() {
  const userConfigDir = path.dirname(userConfigPath);
  if (!fs.existsSync(userConfigPath)) {
    logger.mark(LOG_PREFIX_INIT + ' 配置文件不存在，将使用默认设置文件');
    fs.mkdirSync(userConfigDir, { recursive: true });
    fs.copyFileSync(defaultConfigPath, userConfigPath);
  }
}

function loadDefaults() {
  if (cachedDefaults) return cachedDefaults;
  ensureDefaultConfigExists();
  const defaults = readYaml(defaultConfigPath) || {};
  cachedDefaults = defaults;
  return defaults;
}

function loadConfigFromDisk() {
  const defaults = loadDefaults();
  const userConfig = readYaml(userConfigPath);
  if (!userConfig) {
    return normalizeConfig({ ...defaults }, defaults);
  }
  const merged = mergeDefaults(userConfig, defaults);
  const cleaned = stripUnknownKeys(merged, defaults);
  return normalizeConfig(cleaned, defaults);
}

function refreshCache(force = false) {
  let mtimeMs = 0;
  try {
    if (!fs.existsSync(userConfigPath)) {
      ensureDefaultConfigExists();
      ensureUserConfigExists();
    }
    const stats = fs.statSync(userConfigPath);
    mtimeMs = stats.mtimeMs;
  } catch {
    mtimeMs = 0;
  }

  if (!force && cachedConfig && cachedMtimeMs === mtimeMs) {
    return cachedConfig;
  }

  cachedConfig = loadConfigFromDisk();
  cachedMtimeMs = mtimeMs;
  return cachedConfig;
}

const ConfigService = {
  initialize() {
    ensureDefaultConfigExists();
    ensureUserConfigExists();
    const defaults = loadDefaults();
    const config = loadConfigFromDisk();
    writeYamlAtomic(userConfigPath, config);
    cachedConfig = config;
    try {
      cachedMtimeMs = fs.statSync(userConfigPath).mtimeMs;
    } catch {
      cachedMtimeMs = 0;
    }
    return { defaults, config };
  },

  getConfig() {
    return refreshCache(false);
  },

  getDefConfig() {
    return loadDefaults();
  },

  setConfig(configData) {
    try {
      const defaults = loadDefaults();
      const normalized = normalizeConfig(configData, defaults);
      writeYamlAtomic(userConfigPath, normalized);
      cachedConfig = normalized;
      try {
        cachedMtimeMs = fs.statSync(userConfigPath).mtimeMs;
      } catch {
        cachedMtimeMs = 0;
      }
      return true;
    } catch (error) {
      logger.mark(LOG_PREFIX_CONFIG + `写入 config.yaml 失败: ${error.message}`);
      return false;
    }
  },

  reloadConfig() {
    return refreshCache(true);
  }
};

export default ConfigService;
