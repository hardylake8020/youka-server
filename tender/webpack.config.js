/**
 * Created by zenghong on 16/3/14.
 */
var webpack = require('webpack');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var path = require('path');

module.exports = {
  plugins: [commonsPlugin],
  entry: ['./web/wechat/src/index.js'],
  output: {
    path: './web/wechat/build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel",
        query: {
          presets: ['react']
        }
      }
    ]
  }
};






