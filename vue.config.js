const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/',
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        os: false
      }
    }
  }
});