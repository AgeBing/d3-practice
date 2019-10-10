var express = require('express'),
    path = require('path'),
    consolidate = require('consolidate');

require('babel-register')({
    presets: [ 'env' ]
})

var isDev = process.env.NODE_ENV !== 'production';
var app = express();
var port = 4031;

app.use(express.static('image'));
app.use(express.static('client'));

app.engine('html', consolidate.ejs);
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, './server/views'));
// local variables for all views
app.locals.env = process.env.NODE_ENV || 'dev';
app.locals.reload = true;


var fs = require('fs')

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}))


app.post("/",function(req, res, next) {
    console.log(req.body.reqType)
     if(req.body.reqType=="sometype"){
        let resj = JSON.stringify("from back");
        res.send(resj);
     }
});


if (isDev) {
    var webpack = require('webpack'),
        webpackDevMiddleware = require('webpack-dev-middleware'),
        webpackHotMiddleware = require('webpack-hot-middleware'),
        webpackDevConfig = require('./webpack.config.js');

    var compiler = webpack(webpackDevConfig);
    app.use(webpackDevMiddleware(compiler, {
        publicPath: webpackDevConfig.output.publicPath,
        noInfo: true,
        stats: {
            colors: true
        }
    }));
    app.use(webpackHotMiddleware(compiler));

    require('./server/routes')(app);
    var reload = require('reload');
    var http = require('http');

    var server = http.createServer(app);
    reload(server, app);

    server.listen(port, function(){
        console.log('App (dev) is now running on port ' + port + ' !');
    });
} else {
    app.use(express.static(path.join(__dirname, 'public')));
    require('./server/routes')(app);
    app.listen(port, function () {
        console.log('App (production) is now running on port ' + port + ' !');
    });
}
