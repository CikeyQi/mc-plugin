import { Version } from './components/index.js'
import Index from './tools/index.js'

if (!global.segment) {
  global.segment = (await import('oicq')).segment
}

logger.info(logger.yellow("- 正在载入 MC-PLUGIN"));

export * from './apps/index.js'

logger.info(logger.green(`- MC-PLUGIN ${Version.version} 载入成功`));
logger.info(logger.magenta('- 欢迎加入新组织【貓娘樂園🍥🏳️‍⚧️】（群号 707331865）'));

setTimeout(() => {
  Index.init().catch((err) => {
    logger?.error?.(`[MC-PLUGIN] 初始化失败: ${err?.message || err}`)
  })
}, 1000)
