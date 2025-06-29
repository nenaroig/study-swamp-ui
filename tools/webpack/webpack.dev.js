'use strict';

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  
  // Enhanced dev server configuration
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, '../../dist'),
        publicPath: '/',
      },
      {
        directory: path.resolve(__dirname, '../../public'),
        publicPath: '/',
      }
    ],
    historyApiFallback: {
      rewrites: [
        // { from: /^\/dashboard/, to: '/dashboard.html' },
        // { from: /^\/courses/, to: '/courses.html' },
        // { from: /^\/profile/, to: '/profile.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    port: 8000,
    host: 'localhost',
    open: true,
    hot: true,
    liveReload: true,
    compress: true,
    
    // Watch for file changes!
    watchFiles: [
      'src/**/*',           // Watch all source files
      'public/**/*',        // Watch public files
      'tools/webpack/**/*'  // Watch webpack config changes
    ],
    
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: false,
      logging: 'error',
    },
    
    // Security headers
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
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
    clean: false, // Don't clean in development for faster rebuilds
  },
  
  // Watch mode configuration
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: false,
  },
  
  module: {
    rules: [
      // SCSS/SASS - Override common config to use style-loader for HMR
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
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
              api: 'legacy',
              sassOptions: {
                outputStyle: 'compressed',
                quietDeps: true,
                verbose: false
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
      activeModules: false,
      entries: true,
      modules: false,
      dependencies: false,
    }),
  ],
  
  // Optimization for development
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'named',
    chunkIds: 'named',
  },
  
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
    warnings: false,
    errors: true,
    errorDetails: true,
    builtAt: true,
  },
});