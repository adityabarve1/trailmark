// Lets Metro bundle the shared code in packages/core (outside this folder).
// packages/core has no runtime dependencies, so this app keeps its own node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const coreDir = path.resolve(projectRoot, "../../packages/core");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders ?? []), coreDir];
config.resolver.extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}), "@trailmark/core": coreDir };
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
