'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  
  // Enhanced dev server configuration
  devServer: {
    static: {
      directory: path.resolve(__dirname, '../../dist'),
      publicPath: '/',
    },
    historyApiFallback: true,
    port: 9000,
    host: 'localhost',
    open: true,
    hot: true, // Enable Hot Module Replacement
    compress: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    // Security headers
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    // Enable HTTPS if needed
    // https: true,
  },
  
  // Enhanced caching for faster rebuilds
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '../../node_modules/.cache/webpack'),
  },
  
  // Override output for development
  output: {
    filename: 'assets/js/[name].js',
    chunkFilename: 'assets/js/[name].chunk.js',
    assetModuleFilename: 'assets/[type]/[name][ext]',
  },
  
  module: {
    rules: [
      // SCSS/SASS
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader', // Creates `style` nodes from JS strings
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                ],
              },
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'expanded',
              },
            }
          },
        ],
      },
      
      // CSS
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                ],
              },
            }
          },
        ],
      },
    ]
  },
  
  plugins: [
    // Hot Module Replacement
    new webpack.HotModuleReplacementPlugin(),
    
    // Progress plugin for build feedback
    new webpack.ProgressPlugin({
      activeModules: true,
      entries: true,
      modules: true,
      dependencies: true,
    }),
  ],
  
  // Disable performance hints in development
  performance: {
    hints: false,
  },
  
  // Enhanced stats for development
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
    chunkOrigins: false,
    hash: false,
    timings: true,
    version: false,
    warnings: true,
    errors: true,
    errorDetails: true,
  },
};