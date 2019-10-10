var webpack = require('webpack');
var path = require('path');

var port  = 4031

var publicPath = 'http://localhost:' + port +'/';
var hotMiddlewareScript = 'webpack-hot-middleware/client?reload=true';
var devConfig = {
    entry: {
        page1: ['./client/page1', hotMiddlewareScript],
    },
    output: {
        filename: './[name]/bundle.js',
        path: path.resolve(__dirname, './public'),
        publicPath: publicPath
    },
    devtool: 'eval-source-map',
    module: {
         loaders: [
          {
            test: path.join(__dirname, 'es6'),
            loader: 'babel-loader',
            query: {
              presets: ['es2015']
            }
          }
        ],
        rules: [{
            test: /\.(png|jpg)$/,
            use: 'url-loader?limit=8192&context=client&name=[path][name].[ext]'
        }, {
            test: /\.scss$/,
            use: [
                'style-loader',
                'css-loader?sourceMap',
                'resolve-url-loader',
                'sass-loader?sourceMap'
            ]
        }]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
};

module.exports = devConfig;
