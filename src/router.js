var Router = require('routes')

module.exports = function (api, config) {
  if (!config) config = {}
  var router = Router()

  router.addRoute('POST /obs/create', api.observationCreate.bind(api))
  router.addRoute('GET /obs/list', api.observationList.bind(api))
  router.addRoute('GET /media/list', api.mediaList.bind(api))
  router.addRoute('GET /features/list', api.asFeatureCollection.bind(api))

  router.addRoute('GET /obs/:id', api.observationGet.bind(api))
  router.addRoute('GET /media/:filename', api.mediaGet.bind(api))

  return function (req, res) {
    if (config.domains) {
      config.domains.forEach(function (domain) {
        res.setHeader('Access-Control-Allow-Origin', domain);
      })
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
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
