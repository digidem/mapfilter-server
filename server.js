var http = require('http')
var wsock = require('websocket-stream')
var http = require('http')

var MapFilter = require('.')
var router = require('./src/router')
var replicator = require('./src/replicate')

module.exports = function (osmdir) {
  var api = MapFilter(osmdir)
  var server = http.createServer(router(api))
  server.db = api.db
  wsock.createServer({ server: server , perMessageDeflate: false }, function (socket, request) {
    if (request.url.match(/osm/)) api.replicator.osm(socket)
    else if (request.url.match(/media/)) api.replicator.media(socket)
    else stream.destroy(request.url + ' does not match')
  })

  return server
}
