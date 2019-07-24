const Config = require('./config/config')

const util = require('util')
const DataInterface = require('./dataInterface')
var log4js = require('log4js')
log4js.configure('./src/config/log4js.json')
var log = log4js.getLogger('app')
var https = require('https')
var fs = require('fs')


var express = require('express')

var app = express()

var port = process.env.PORT || 8081

var bodyParser = require('body-parser')

var fileUpload = require('express-fileupload')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(fileUpload())

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization,  Content-Length, X-Requested-With'
    )

    log.info(`${req.method}:${req.originalUrl}`)

    // intercepts OPTIONS method
    if (req.method === 'OPTIONS') {
        // respond with 200
        res.sendStatus(200)
    } else {
        //  move on
        next()
    }

    res.once('finish', function () {
        var translog = res.locals
        // log.debug(translog)
        if (translog && translog.transactionType) {
            translog.result =
                res.statusCode == 200 || res.statusCode == 201 ? 'SUCCESS' : 'FAIL'
            DataInterface.SaveTransLog(
                translog,
                function () {
                    log.info('translog saved')
                },
                function (err) {
                    log.info('translog not saved:' + err)
                    log.info('translog:' + JSON.stringify(translog, null, 2))
                }
            )
        }
    })
})

var routes = require('./routes/cosballRoutes') // importing route
routes(app)

app.use(function (req, res) {
    log.info(`${req.method}:${req.originalUrl} not found`)
    res.status(404).send({ url: req.originalUrl + ' not found' })
})

if (Config.USE_SSL) {
    log.info('SSL enabled')
    var ssl = {
        key: fs.readFileSync('/etc/letsencrypt/live/api.cosnet.io/privkey.pem', 'utf8'),
        cert: fs.readFileSync('/etc/letsencrypt/live/api.cosnet.io/cert.pem', 'utf8'),
        ca: [fs.readFileSync('/etc/letsencrypt/live/api.cosnet.io/fullchain.pem', 'utf8')]    
    };

    https.createServer(ssl, app).listen(port)
}
else {
    app.listen(port)
}


log.info('Cosball BC API server started on: ' + port)
