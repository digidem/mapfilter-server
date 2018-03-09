# mapfilter-server

[![Build
Status](https://travis-ci.org/digidem/mapfilter-server.svg?branch=master)](https://travis-ci.org/digidem/mapfilter-server)

Server for viewing mapfilter data over HTTP and replication via websockets.

## Run from the Terminal

```
$ npm install -g mapfilter-server
$ mapfilter-server <db> [config]
```

  * `db`: required. The path to the database folder. If it doesn't exist, mapfilter-server will create it.
  * `config`: optional. The path to a config file.

## Simple Usage

If you just want to take our defaults, mapfilter-server carries a built-in server that you can use in Node.js like so:

```
npm install mapfilter-server
```

```js
var MapFilter = require('mapfilter-server')

var server = MapFilter.createServer('/path/to/my/osm/data')

server.listen(8008, function () {
  console.log('listening')
})
```


From a client, you can then replicate to the server from your local `mapfilter-db` via websocket-stream:

```js
var db = require('mapfilter-db')
var websocket = require('websocket-stream')

var ws = websocket('ws://localhost:8008/osm')
var osm = db('/path/to/my/db')
var stream = osm.createOsmReplicationStream()
pump(stream, ws, stream, done)

function done (err) {
  if (err) throw err
  console.log('Replication to server complete!')
}
```

## API

To include mapfilter-server in an existing server and pick your own route names, you can use the request/response api directly.

```js
var MapFilter = reuqire('mapfilter-server')
var http = require('http')
var router = require('routes')()
var wsock = require('websocket-stream')

var api = MapFilter(osmdir)

var server = http.createServer(function (req, res) {
  
  router.addRoute('GET /obs/:id', function (req, res, m) {
    api.observationGet(req, res, {id: m.params.id})
  })

  router.addRoute('GET /media/:filename', function (req, res, m) {
    api.mediaGet(req, res, {filename: m.params.filename})
  })

  router.addRoute('GET /obs/list', api.observationList.bind(api))
  router.addRoute('GET /media/list', api.mediaList.bind(api))

  // Observation in POST body as JSON data
  router.addRoute('POST /obs/create', api.observationCreate.bind(api))
}

wsock.createServer({
  server: server , perMessageDeflate: false
}, function (socket, request) {
  if (request.url.match(/osm/)) mapfilter.replicate.osm(socket)
  else if (request.url.match(/media/)) mapfilter.replicate.media(socket)
  else stream.destroy(request.url + ' does not match')
})
```

## Config File

The config file should be a JSON file. 

Options:
  * `domains`: Optional. Array of domains that are allowed to make Cross-Domain requests. 
