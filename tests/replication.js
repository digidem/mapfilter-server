const test = require('tape')
const store = require('../store')
const tmp = require('os-tmpdir')
const path = require('path')

const tmpdir = path.join(tmp(), 'mapfilter-sync-server-test-files')
const tmpdir2 = path.join(tmp(), 'mapfilter-sync-server-test-files-2')

function cleanup () {
  rmdir(tmpdir)
}

test('local osm replication', function (t) {
  var s1 = store(tmpdir)
  var s2 = store(tmpdir2)
  var id = null
  var node = null
  s1.osm.create({
    foo: 'bar',
    timestamp: new Date().toISOString()
  }, done)
  function done (err, _id, _node) {
    t.error(err)
    id = _id
    node = _node
    s1.osm.get(id, function (err, docs) {
      t.error(err)
      t.same(docs[node.key], node.value.v)
      replicate()
    })
  }
  function replicate () {
    var r1 = s1.createOsmReplicationStream()
    var r2 = s2.createOsmReplicationStream()
    r1.pipe(r2).pipe(r1).on('end', function () {
      s2.osm.get(id, function (err, docs) {
        t.error(err)
        t.same(docs[node.key], node.value.v)
        t.end()
      })
    })
  }
})
