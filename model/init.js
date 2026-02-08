import Config from '../components/Config.js';
import { LOG_PREFIX_INIT } from '../components/logging/prefixes.js';

class Init {
  constructor() {
    this.initialize();
  }

  initialize() {
    try {
      Config.initialize();
    } catch (error) {
      logger.mark(LOG_PREFIX_INIT + ' 初始化失败' + error.message);
      throw error;
    }
  }
}

export default new Init();
