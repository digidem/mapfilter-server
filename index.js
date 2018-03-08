var ospath = require('ospath')
var path = require('path')
var MapfilterDb = require('mapfilter-db')

var Api = require('./src/api')

function MapFilter (osmdir) {
  if (!osmdir) {
    osmdir = path.join(ospath.data(), 'mapfilter-osm-p2p-server')
    console.log('using default osmdir', osmdir)
  }
  // TODO: allow option to pass in your own store. If a string,
  // assume its a directory, otherwise it should be a MapfilterDb instance
  return Api(MapfilterDb(osmdir))
}

module.exports = MapFilter
