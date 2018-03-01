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

const Server = require('../server')

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

test.skip('websocket media replication', function (t) {
  var ws = s1.media.createWriteStream('foo.txt')
  var pending  = 1
  ws.on('finish', written)
  ws.on('error', written)
  ws.write('bar')
  ws.end()

  function written (err) {
    t.error(err)
    if (--pending === 0) replicate()
  }

  function replicate () {
    var r1 = s1.createMediaReplicationStream()
    t.ok(true, 'replication started')

    var pending = 2
    var ws = websocket(`ws://localhost:${port}/media`)
    pump(r1, ws, r1, done)

    function done (err) {
      t.error(err)
      if (--pending === 0) {
        t.ok(true, 'replication ended')
        t.ok(fs.existsSync(path.join(tmpdir2, 'media', 'foo', 'foo.txt')))
        t.equal(fs.readFileSync(path.join(tmpdir2, 'media', 'foo', 'foo.txt')).toString(), 'bar')
        t.end()
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
        t.end()
      })
    }
  }
})

test('list observations with http', function (t) {
  needle.get(`http://localhost:${port}/obs/list`, function (error, response) {
    t.error(error)
    t.same(response.statusCode, 200)
    var obs = JSON.parse(response.body.toString())
    t.same(obs.length, 2)
    for (var i = 0; i < obs.length; obs++) {
      var o = obs[i]
      t.same(o.type, 'observation')
      t.same(o.tags, {})
    }
    t.end()
  })
})

test('create observation with http', function (t) {
  var observation = {
    type: 'observation',
    tags: EXAMPLES[0]
  }
  needle.request('post', `http://localhost:${port}/obs/create`, observation, {json: true}, function (error, response) {
    t.error(error)
    t.same(response.statusCode, 200)
    var result = response.body.toString()
    server.store.osm.get(result, function (err, docs) {
      t.error(err)
      t.ok(docs)
      cleanup(t)
    })
  })
})
