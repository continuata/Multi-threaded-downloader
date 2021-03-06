'use strict'
var path = require('path')
var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var fs = require('fs')
var options = {
  key: fs.readFileSync(path.join(__dirname, '/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/key-cert.pem'))
}
var httpServer = http.createServer(app)
var httpsServer = https.createServer(options, app)
app.use('/files', express.static(path.join(__dirname, '/files')))

const startServer = (app, port) => new Promise((i) => { // eslint-disable-line
  const onClose = () => new Promise((i) => server.close(i)) // eslint-disable-line
  const onStart = () => i(onClose)
  const server = app.listen(port, onStart)
})

exports.server = (port) => Promise.all([
  startServer(httpServer, port),
  startServer(httpsServer, port + 1)
]).then((x) => () => Promise.all(x.map((x) => x())))

