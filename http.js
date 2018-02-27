var through = require('through2')
var ndjson = require('ndjson')
var xtend = require('xtend')
var router = require('routes')()
var pump = require('pump')

router.addRoute('GET /obs/links/:id', function (req, res, m) {
  pump(m.db.obs.links(m.params.id), through.obj(write), res, done)
  function write (row, enc, next) {
    next(null, JSON.stringify(row) + '\n')
  }
  function done (err) {
    if (err) {
      res.statusCode = 500
      res.end(err + '\n')
    }
  }
})

router.addRoute('GET /obs/list', function (req, res, m) {
  pump(m.db.observationStream(), ndjson.stringify(), res, done)
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
