var Router = require('routes')

module.exports = function (api) {
  var router = Router()

  router.addRoute('POST /obs/create', api.observationCreate.bind(api))
  router.addRoute('GET /obs/list', api.observationList.bind(api))
  router.addRoute('GET /media/list', api.mediaList.bind(api))
  router.addRoute('GET /obs/:id', api.observationGet.bind(api))
  router.addRoute('GET /media/:filename', api.mediaGet.bind(api))

  return function (req, res) {
    var m = router.match(req.method + ' ' + req.url)
    if (m) {
      m.fn(req, res, m.params)
    }
    else {
      res.statusCode = 404
      res.end('not found')
    }
  }
}
