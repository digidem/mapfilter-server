#!/usr/bin/env node
var path = require('path')
var fs = require('fs')

var MF = require('..')

var osmdir = process.argv[2]
var configPath = process.argv[3] || path.join(process.cwd(), 'config.json')

var config = {}
if (fs.existsSync(configPath)) {
  console.log('Using config file at', configPath)
  config = JSON.parse(fs.readFileSync(configPath).toString())
} else {
  console.error('No config file found! Using server defaults.')
}

if (!osmdir) {
  console.error('mapfilter-server /path/to/somewhere/safe')
  process.exit(1)
}

var server = MF.createServer(osmdir, config)

server.listen(3210, function () {
  console.log('http://localhost:3210')
})
