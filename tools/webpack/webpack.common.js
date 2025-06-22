'use strict';

const path = require('path');
const webpack = require('webpack');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, '../..'), // Project root
  
  entry: {
    main: './src/scripts/main.js',
    styles: './src/styles/main.scss',
  },
  
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'assets/js/[name].[contenthash:8].js',
    chunkFilename: 'assets/js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[type]/[name].[contenthash:8][ext]',
    clean: true,
    crossOriginLoading: 'anonymous',
    publicPath: '/',
  },
  
  resolve: {
    extensions: ['.js', '.scss', '.css', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@assets': path.resolve(__dirname, '../../src/images'),
      '@styles': path.resolve(__dirname, '../../src/styles'),
      '@scripts': path.resolve(__dirname, '../../src/scripts'),
    },
  },
  
  module: {
    rules: [
      // JavaScript
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 0.5%', 'last 2 versions', 'not dead', 'not ie <= 11']
                },
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3,
              }]
            ],
            cacheDirectory: true,
            cacheCompression: false,
          }
        }
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[contenthash:8][ext]'
        },
      },
      
      // Images
      {
        test: /\.(jpg|jpeg|gif|png|svg|webp|avif|ico)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          }
        },
        generator: {
          filename: 'assets/images/[name].[contenthash:8][ext]'
        },
      },
      
      // HTML Templates
      {
        test: /\.html$/i,
        use: [
          {
            loader: 'html-loader',
            options: {
              sources: {
                list: [
                  {
                    tag: 'img',
                    attribute: 'src',
                    type: 'src',
                  },
                  {
                    tag: 'link',
                    attribute: 'href',
                    type: 'src',
                    filter: (tag, attribute, attributes) => {
                      return attributes.rel && attributes.rel.includes('icon');
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      
      // JSON data files
      {
        test: /\.json$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/data/[name].[contenthash:8][ext]'
        },
      },
    ]
  },
  
  plugins: [
    // Generate HTML pages
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      title: 'Study Swamp - Login',
      inject: 'body',
      scriptLoading: 'defer',
      chunks: ['main', 'styles'],
    }),
    
    // Copy public assets
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'public',
          to: '.',
          noErrorOnMissing: true,
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
        {
          from: 'src/data',
          to: 'assets/data',
          noErrorOnMissing: true,
        }
      ],
    }),
    
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    
    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
  
  // Performance hints
  performance: {
    maxEntrypointSize: 512000, // 500kb
    maxAssetSize: 512000,
    hints: 'warning',
  },
};