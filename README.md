# mapfilter-server

[![Build
Status](https://travis-ci.org/digidem/mapfilter-server.svg?branch=master)](https://travis-ci.org/digidem/mapfilter-server)

Server for viewing mapfilter data over HTTP and replication via websockets.

## Usage

To set up your own observation server, mapfilter-sync carries a built-in server
that you can use like this:

```js
var MapFilterServer = require('mapfilter-server')
var server = MapFilterServer('/path/to/my/osm/data')

server.listen(8008, function () {
  console.log('listening')
})
```

And replication via websocket-stream:

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
