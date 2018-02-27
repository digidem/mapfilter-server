var mkdirp = require('mkdirp')
var level = require('level')
var osmdb = require('osm-p2p')
var osmobs = require('osm-p2p-observations')
var MediaStore = require('p2p-file-store')
var path = require('path')

module.exports = Store

function Store (osmdir) {
  if (!(this instanceof Store)) return new Store(osmdir)
  var mediadir = path.join(osmdir, 'media')
  mkdirp.sync(mediadir)
  var obsdb = level(path.join(osmdir, 'obsdb'))
  this.media = MediaStore(mediadir)
  this.osm = osmdb(osmdir)
  this.obs = osmobs({ db: obsdb, log: this.osm.log })
}

Store.prototype.createOsmReplicationStream = function () {
  return this.osm.log.replicate()
}

Store.prototype.createMediaReplicationStream = function () {
  return this.media.replicateStream()
}

Store.prototype.replicate = function (r1, r2, cb) {
  r1.pipe(r2).pipe(r1)

  r1.on('end', onDone)
  r2.on('end', onDone)

  var pending = 2
  function onDone () {
    if (!--pending) cb()
  }
}
