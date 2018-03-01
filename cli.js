var path = require('path')
var Server = require('./server')

var server = Server(path.join(__dirname, 'db'))
server.listen(3210, function () {
  console.log('http://localhost:3210')
})
