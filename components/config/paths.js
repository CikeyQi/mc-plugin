import path from 'path';
import { pluginRoot } from '../../model/path.js';

const configDir = path.join(pluginRoot, 'config');
const defaultConfigPath = path.join(configDir, 'config_default.yaml');
const userConfigPath = path.join(configDir, 'config', 'config.yaml');

export { configDir, defaultConfigPath, userConfigPath };
