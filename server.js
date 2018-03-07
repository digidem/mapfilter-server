var http = require('http')
var pump = require('pump')
var eos = require('end-of-stream')
var wsock = require('websocket-stream')
var Store = require('mapfilter-db')
var router = require('./http')

var http = require('http')
var ospath = require('ospath')
var path = require('path')

module.exports = function (osmdir) {
  if (!osmdir) {
    osmdir = path.join(ospath.data(), 'mapfilter-osm-p2p-server')
    console.log('using default osmdir', osmdir)
  }
  var store = Store(osmdir)
  var server = http.createServer(router(store))
  server.store = store
  var replicating = false

  wsock.createServer({ server: server , perMessageDeflate: false }, function (stream, request) {
    if (request.url.match(/osm/)) replicateOsm(stream)
    else if (request.url.match(/media/)) replicateMedia(stream)
    else stream.destroy(request.url + ' does not match')
  })

  return server

  function replicateOsm (socket) {
    var src = store.createOsmReplicationStream()
    if (replicating) {
      console.log('NET REPLICATION: already replicating')
      return
    }
    pump(src, socket, src, function (err) {
      replicating = false
      if (err) console.log('Net REPLICATION', err)
      else console.log('NET REPLICATION: done')
      store.osm.ready(function () {
        console.log('NET REPLICATION: indexes caught up')
      })
    })
  }

  function replicateMedia (socket) {
    console.log('MEDIA REPLICATION: starting')
    replicating = true
    var src = store.createMediaReplicationStream()
    pump(src, socket, src, function (err) {
      replicating = false
      if (err) console.log('REPLICATION', err)
      else console.log('MEDIA REPLICATION: done')
    })
  }
}
