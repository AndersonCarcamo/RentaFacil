const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add support for Hermes
config.transformer.unstable_allowRequireContext = true;

module.exports = config;