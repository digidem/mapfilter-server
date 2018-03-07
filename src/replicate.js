var pump = require('pump')
var debug = require('debug')('mapfilter-server')

module.exports = Replicator

function Replicator (store) {
  if (!(this instanceof Replicator)) return new Replicator(store)
  this.store = store
  this.replicating = false
}

Replicator.prototype.osm = function (socket) {
  var self = this
  var src = this.store.createOsmReplicationStream()
  this._replicate(src, socket, function (err) {
    self.store.osm.ready(function () {
      debug('OSM REPLICATION: indexes caught up')
    })
  })
}

Replicator.prototype.media = function (socket) {
  debug('MEDIA REPLICATION: starting')
  var src = this.store.createMediaReplicationStream()
  this._replicate(src, socket)
}

Replicator.prototype._replicate = function (src, socket, done) {
  var self = this
  if (this.replicating) {
    debug('REPLICATION: already replicating')
    return
  }
  this.replicating = true
  socket.on('close', function () {
    self.replicating = false
  })
  pump(src, socket, src, function (err) {
    if (err) debug('REPLICATION ERROR:', err)
    else debug('REPLICATION: done')
    if (done) done(err)
  })
}
