const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona expressões regulares para ignorar as pastas nativas e o cache do Gradle
config.resolver.blockList = [
  /android\/.*/,
  /ios\/.*/,
  /\.gradle\/.*/,
  /.*\/__tests__\/.*/,
  /.*\.(test|spec)\.(ts|tsx|js|jsx)$/,
];

module.exports = config;
