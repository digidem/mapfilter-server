#!/usr/bin/env node
var path = require('path')
var Server = require('../server')

var osmdir = process.argv[2]
if (!osmdir) {
  console.error('mapfilter-server /path/to/somewhere/safe')
  process.exit(1)
}

var server = Server(osmdir)

server.listen(3210, function () {
  console.log('http://localhost:3210')
})
