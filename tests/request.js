const rimraf = require('rimraf')
const fs = require('fs')
const test = require('tape')
const tmp = require('os-tmpdir')
const path = require('path')
const getport = require('getport')
const needle = require('needle')

const Server = require('..')

const tmpdir = path.join(tmp(), 'mapfilter-sync-test-request')
rimraf.sync(tmpdir)

var server = Server(tmpdir)

function cleanup (t) {
  server.close(function () {
    rimraf.sync(tmpdir)
    t.end()
  })
}
var port = 8761

server.listen(port, function () {
  console.log('Server listening on port', port)

  var EXAMPLES = [
    JSON.parse(fs.readFileSync(path.join(__dirname, 'observations', 'observation_0.json')).toString()),
    JSON.parse(fs.readFileSync(path.join(__dirname, 'observations', 'observation_1.json')).toString())
  ]


  test('create observation with http', function (t) {
    var observation = {
      type: 'observation',
      tags: EXAMPLES[1]
    }
    needle.request('post', `http://localhost:${port}/obs/create`, observation, {json: true}, function (error, response) {
      t.error(error)
      t.same(response.statusCode, 200)
      var result = response.body.toString()
      server.store.osm.get(result, function (err, docs) {
        t.error(err)
        t.ok(docs)
        t.end()
      })
    })
  })

  var id = null

  test('list observations with http', function (t) {
    needle.get(`http://localhost:${port}/obs/list`, function (error, response) {
      t.error(error)
      t.same(response.statusCode, 200)
      var obs = JSON.parse(response.body.toString())
      t.same(obs.length, 1)
      var o = obs[0]
      id = o.id
      t.same(o.type, 'observation')
      t.same(o.tags, {})
      t.same([o.lon, o.lat], EXAMPLES[1].geometry.coordinates)
      t.end()
    })
  })

  test('get an observation with http', function (t) {
    needle.get(`http://localhost:${port}/obs/${id}`, function (error, response) {
      t.error(error)
      t.same(response.statusCode, 200)
      var obs = response.body
      var o = obs[0]
      t.same([o.lon, o.lat], EXAMPLES[1].geometry.coordinates)
      t.end()
    })
  })

  test('get media with http', function (t) {
    var ws = server.store.media.createWriteStream('hello.txt')
    ws.on('error', function () {
      t.error(err)
    })
    ws.on('finish', function () {
      needle.get(`http://localhost:${port}/media/hello.txt`, function (error, response) {
        t.error(error)
        t.same(response.statusCode, 200)
        t.same(response.body.toString(), 'world')
        t.end()
      })
    })
    ws.write('world')
    ws.end()
  })

  test('list media with http', function (t) {
    needle.get(`http://localhost:${port}/media/list`, function (error, response) {
      t.error(error)
      t.same(response.statusCode, 200)
      var media = response.body
      t.same(media[0], 'hello.txt')
      cleanup(t)
    })
  })
})
