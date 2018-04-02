var body = require('body/json')
var mime = require('mime')
var through = require('through2')
var JSONStream = require('JSONStream')
var ndjson = require('ndjson')
var xtend = require('xtend')
var values = require('object.values')
var pump = require('pump')
var Replicator = require('./replicate')

module.exports = API

function API (db) {
  if (!(this instanceof API)) return new API(db)
  this.replicator = Replicator(db)
  this.db = db
}

API.prototype.mediaGet = function (req, res, m) {
  var stream = this.db.media.createReadStream(m.filename)
  stream.once('error', function (err) {
    if (err.message.indexOf('no such file')) err = new Error('Media not found.')
    res.setHeader('content-type', 'text/plain')
    res.statusCode = 404
    res.end(err.toString())
  })
  res.setHeader('content-type', mime.getType(m.filename))
  pump(stream, res)
}

API.prototype.observationCreate = function (req, res, m) {
  var self = this
  body(req, res, function (err, doc) {
    if (err) {
      res.statusCode = 400
      return res.end(err.message)
    } else if (!doc || !/^observation(|-link)$/.test(doc.type)) {
      res.statusCode = 400
      return res.end('type must be observation or observation-link\n')
    }
    self.db.observationCreate(doc.tags, function (err, result) {
      if (err) {
        res.statusCode = 500
        res.end(err)
      } else {
        res.end(result.value.k)
      }
    })
  })
}

var _public = through.obj(function (obs, enc, next) {
  if (obs.tags.public) return next(null, obs)
  else return next()
})

API.prototype.observationList = function (req, res, m) {
  if (m.stream) parser = ndjson.stringify()
  else parser = JSONStream.stringify()
  pump(this.db.observationStream(), _public, parser, res, done)
  function done (err) {
    if (err) {
      res.statusCode = 500
      res.end(err)
    }
  }
}

API.prototype.mediaList = function (req, res) {
  var stream = this.db.media._list(function (err, names) {
    if (err) {
      res.statusCode = 200
      res.end(err.toString())
      return
    }
    res.setHeader('content-type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify(names))
  })
}

API.prototype.observationGet = function (req, res, m) {
  this.db.osm.get(m.id, function (err, result) {
    if (err) {
      res.statusCode = 500
      res.end(err)
    }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(values(result)))
  })
}

API.prototype.asFeatureCollection = function (req, res, m) {
  var stream = this.db.observationStream({features: true})

  var open = '{"type": "FeatureCollection","features":[\n'
  var sep = '\n,\n'
  var close = '\n]}\n'
  var toFeatureCollection = JSONStream.stringify(open, sep, close)
  pump(stream, toFeatureCollection, res, function (err) {
    if (err) return res.end(err)
  })
}
