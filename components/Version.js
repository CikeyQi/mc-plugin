import fs from 'node:fs'
import path from 'node:path'
import { pluginRoot } from '../models/path.js'

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

let yunzaiPackage = readJson('package.json')
let pluginPackage = readJson(path.join(pluginRoot, 'package.json'))

const yunzaiVersion = yunzaiPackage.version || ''
const currentVersion = pluginPackage.version || ''
const runtimeName = yunzaiPackage.name || ''
const isMiao = runtimeName === 'miao-yunzai'
const isTrss = Array.isArray(globalThis.Bot?.uin)

let Version = {
  isMiao,
  isTrss,
  get version () {
    return currentVersion
  },
  get yunzai () {
    return yunzaiVersion
  }
}

export default Version
