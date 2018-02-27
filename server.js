var http = require('http')
var eos = require('end-of-stream')
var wsock = require('websocket-stream')
var mapfilterSync = require('.')
var Store = require('mapfilter-db')

var http = require('http')
var ospath = require('ospath')
var path = require('path')

module.exports = function (osmdir) {
  if (!osmdir) {
    osmdir = path.join(ospath.data(), 'mapfilter-osm-p2p')
    console.log('using default osmdir', osmdir)
  }
  var store = Store(osmdir)
  var server = http.createServer(function (req, res) {
   //nothing to see here yet
  })
  server.store = store
  var replicating = false

  wsock.createServer({ server: server }, function (stream, request) {
    if (request.url.match(/osm/)) replicateOsm(stream)
    else if (request.url.match(/media/)) replicateMedia(stream)
    else stream.destroy(request.url + ' does not match')
  })

  return server

  function replicateOsm (socket) {
    replicate(store.createOsmReplicationStream(), socket)
  }

  function replicateMedia (socket) {
    replicate(store.createMediaReplicationStream(), socket)
  }

  function replicate (src, socket) {
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
      if (--pending !== 0) return
      console.log('NET REPLICATION: done')
      replicating = false
      store.osm.ready(function () {
        console.log('NET REPLICATION: indexes caught up')
      })
    }
  }

  function syncErr (err) {
    replicating = false
    console.log('NET REPLICATION: err', err)
  }
}
