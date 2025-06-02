'use strict';

const { merge } = require('webpack-merge');
const common = require('./tools/webpack/webpack.common.js');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  if (isProduction) {
    const prodConfig = require('./tools/webpack/webpack.prod.js');
    return merge(common, prodConfig);
  } else {
    const devConfig = require('./tools/webpack/webpack.dev.js');
    return merge(common, devConfig);
  }
};