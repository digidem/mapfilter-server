var http = require('http')
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

  wsock.createServer({ server: server }, function (stream, request) {
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
    var pending = 2
    console.log('NET REPLICATION: starting')
    replicating = true
    src.on('error', syncErr)
    socket.on('error', syncErr)
    socket.pipe(src).pipe(socket)
    eos(src, onend)
    eos(socket, onend)
    function onend () {
      if (!--pending) {
        console.log('NET REPLICATION: done')
        replicating = false
        store.osm.ready(function () {
          console.log('NET REPLICATION: indexes caught up')
        })
      }
    }
  }

  function replicateMedia (socket) {
    console.log('MEDIA REPLICATION: starting')
    var src = store.createMediaReplicationStream()
    src.on('error', syncErr)
    socket.on('error', syncErr)
    src.pipe(socket).pipe(src)
    src.on('end', onDone)
    socket.on('end', onDone)

    var pending = 2
    function onDone () {
      if (!--pending) {
        console.log('MEDIA REPLICATION: done')
      }
    }
  }

  function syncErr (err) {
    replicating = false
    console.log('REPLICATION', err)
  }
}
