const rimraf = require('rimraf')
const pump = require('pump')
const fs = require('fs')
const collect = require('collect-stream')
const test = require('tape')
const tmp = require('os-tmpdir')
const path = require('path')
const getport = require('getport')
const needle = require('needle')
const websocket = require('websocket-stream')
const store = require('mapfilter-db')

const Server = require('..')

const tmpdir = path.join(tmp(), 'mapfilter-sync-test-local')
const tmpdir2 = path.join(tmp(), 'mapfilter-sync-test-server')
rimraf.sync(tmpdir)
rimraf.sync(tmpdir2)

var EXAMPLES = [
  JSON.parse(fs.readFileSync(path.join(__dirname, 'observations', 'observation_0.json')).toString()),
  JSON.parse(fs.readFileSync(path.join(__dirname, 'observations', 'observation_1.json')).toString())
]

var s1 = store(tmpdir)
var server = Server(tmpdir2)

var port = null
getport(function (e, p) {
  server.listen(p, function () {
    port = p
    console.log('Server listening on port', port)
  })
})

function cleanup (t) {
  s1.close(function () {
    server.close(function () {
      rimraf.sync(tmpdir)
      rimraf.sync(tmpdir2)
      t.end()
    })
  })
}

test('websocket media replication', function (t) {
  var ws = s1.media.createWriteStream('foo.txt')
  ws.on('finish', replicate)
  ws.on('error', function (err) {
    t.error(err)
  })
  ws.write('bar')
  ws.end()

  function replicate () {
    var r1 = s1.createMediaReplicationStream()
    t.ok(true, 'replication started')

    var pending = 2
    var ws = websocket(`ws://localhost:${port}/media`, {
      perMessageDeflate: false,
      binary: true
    })
    r1.pipe(ws).pipe(r1)

    r1.on('error', onError)
    ws.on('error', onError)
    r1.on('end', onDone)
    ws.on('end', onDone)

    function onError (err) {
      pending = Infinity
      t.error(err)
    }

    var pending = 2
    function onDone () {
      if (!--pending) {
        t.ok(true, 'replication ended')
        t.ok(fs.existsSync(path.join(tmpdir2, 'media', 'foo', 'foo.txt')))
        t.equal(fs.readFileSync(path.join(tmpdir2, 'media', 'foo', 'foo.txt')).toString(), 'bar')
        needle.get(`http://localhost:${port}/media/list`, function (error, response) {
          t.error(error)
          t.same(response.statusCode, 200)
          var media = response.body
          t.same(media[0], 'foo.txt')
          t.end()
        })
      }
    }
  }
})

test('websocket osm replication', function (t) {
  var id = null
  var node = null
  s1.observationCreate(EXAMPLES[0], () => s1.observationCreate(EXAMPLES[1], done))

  function done (err, _node) {
    t.error(err)
    id = _node.value.k
    node = _node
    s1.osm.get(id, function (err, docs) {
      t.error(err)
      t.same(docs[node.key], node.value.v)
      replicate()
    })
  }

  function replicate () {
    var r1 = s1.createOsmReplicationStream()
    var ws = websocket(`ws://localhost:${port}/osm`)
    pump(r1, ws, r1, done)

    function done () {
      server.store.osm.get(id, function (err, docs) {
        t.error(err)
        t.same(docs[node.key], node.value.v)
        cleanup(t)
      })
    }
  }
})
