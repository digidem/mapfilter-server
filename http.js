var body = require('body/json')
var mime = require('mime')
var JSONStream = require('JSONStream')
var ndjson = require('ndjson')
var xtend = require('xtend')
var router = require('routes')()
var pump = require('pump')

router.addRoute('POST /obs/create', function (req, res, m) {
  body(req, res, function (err, doc) {
    if (err) {
      res.statusCode = 400
      return res.end(err.message)
    } else if (!doc || !/^observation(|-link)$/.test(doc.type)) {
      res.statusCode = 400
      return res.end('type must be observation or observation-link\n')
    }
    m.db.observationCreate(doc.tags, function (err, result) {
      if (err) {
        res.statusCode = 500
        res.end(err)
      } else {
        res.end(result.value.k)
      }
    })
  })
})


router.addRoute('GET /obs/list', function (req, res, m) {
  if (m.params.stream) parser = ndjson.stringify()
  else parser = JSONStream.stringify()
  pump(m.db.observationStream(), parser, res, done)
  function done (err) {
    if (err) {
      res.statusCode = 500
      res.end(err)
    }
  }
})

router.addRoute('GET /obs/:id', function (req, res, m) {
  m.db.osm.get(m.params.id, function (err, result) {
    if (err) {
      res.statusCode = 500
      res.end(err)
    }
    res.end(JSON.stringify(Object.values(result)))
  })
})

router.addRoute('GET /media/:filename', function (req, res, m) {
  var stream = m.db.media.createReadStream(m.params.filename)
  stream.once('error', function (err) {
    if (err.message.indexOf('no such file')) err = new Error('Media not found.')
    res.setHeader('content-type', 'text/plain')
    res.statusCode = 404
    res.end(err.toString())
  })

  res.setHeader('content-type', mime.getType(m.params.file))
  pump(stream, res)
})


module.exports = function (db) {
  return function (req, res) {
    console.log(req.method, req.url)
    var m = router.match(req.method + ' ' + req.url)
    if (m) m.fn(req, res, { db: db, params: m.params })
    else {
      res.statusCode = 404
      res.end('not found')
    }
  }
}
