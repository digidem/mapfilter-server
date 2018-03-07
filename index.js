var http = require('http')
var eos = require('end-of-stream')
var wsock = require('websocket-stream')
var Store = require('mapfilter-db')
var http = require('http')
var ospath = require('ospath')
var path = require('path')

var router = require('./src/router')
var replicator = require('./src/replicate')

module.exports = function (osmdir) {
  if (!osmdir) {
    osmdir = path.join(ospath.data(), 'mapfilter-osm-p2p-server')
    console.log('using default osmdir', osmdir)
  }
  var store = Store(osmdir)
  var server = http.createServer(router(store))
  var replicate = replicator(store)
  server.store = store
  wsock.createServer({ server: server , perMessageDeflate: false }, function (socket, request) {
    if (request.url.match(/osm/)) replicate.osm(socket)
    else if (request.url.match(/media/)) replicate.media(socket)
    else stream.destroy(request.url + ' does not match')
  })

  return server
}
