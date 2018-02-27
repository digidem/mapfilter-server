var path = require('path')
var getport = require('getport')
var Server = require('./server')

var server = Server(path.join(__dirname, 'db'))
getport(function (e, p) {
  server.listen(p, function () {
    port = p
    console.log('Server listening on port', port)
  })
})
