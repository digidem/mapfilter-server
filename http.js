var through = require('through2')
var JSONStream = require('JSONStream')
var ndjson = require('ndjson')
var xtend = require('xtend')
var router = require('routes')()
var pump = require('pump')

router.addRoute('GET /obs/list', function (req, res, m) {
  if (m.params.stream) parser = ndjson.stringify()
  else parser = JSONStream.stringify()
  pump(m.db.observationStream(), parser, res, done)
  function done (err) {
    if (err) {
      res.statusCode = 500
      res.end(err + '\n')
    }
  }
})

module.exports = function (db) {
  return function (req, res) {
    console.log(req.method, req.url)
    var m = router.match(req.method + ' ' + req.url)
    if (m) m.fn(req, res, { db: db, params: m.params })
    else {
      res.statusCode = 404
      res.end('not found\n')
    }
  }
}
