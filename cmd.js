#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var env = process.env
var minimist = require('minimist')
var pump = require('pump')
var argv = minimist(process.argv.slice(2), {
  alias: {
    v: 'version', h: 'help',
    d: 'datadir', f: 'format', p: 'port', q: 'quiet'
  },
  boolean: ['quiet','help','version'],
})

if (argv.help || argv._[0] === 'help') {
  console.log(`
    usage: ${path.basename(process.argv[1])} COMMAND ...

      query URI - list all features that intersect BBOX

        URI is a hyper://, ipfs://, or https?:// link to the peermaps dataset
        BBOX is in west,south,east,north form.

        -f FORMAT   - display results in FORMAT: base64 (default), lp
        --bbox=BBOX - list all features that intersect BBOX

        The rows of output are in georender format:
        https://github.com/peermaps/docs/blob/master/georender.md

      http URI - serve peermaps content from URI

        URI is a hyper://, ipfs://, or https?:// link to the peermaps dataset

        -p --port   - server http on this port
        -q --quiet  - do not log http requests to stdout

  `.trim().replace(/^ {4}/gm,'') + '\n')
} else if (argv.version || argv._[0] === 'version') {
  console.log(require('./package.json').version)
} else if (argv._[0] === 'datadir') {
  console.log(getDataDir())
} else if (argv._[0] === 'query') {
  var u = argv._[1]
  var datadir = getDataDir()
  var bbox = argv.bbox.split(',').map(Number)
  var m, storage
  if (m = /^hyper:[\/]*([^\/]+)/.exec(u)) {
    var file = path.join(datadir, m[1].replace(/[^A-Za-z0-9]+/g,'-'))
    var storage = require('./lib/hyperdrive')(file, u)
  } else {
    return console.error('URI not yet supported')
  }
  var eyros = require('eyros/2d')
  var wasmSource = fs.readFileSync(require.resolve('eyros/2d.wasm'))
  var format = argv.format || 'base64'
  var lp = null
  if (format === 'lp') {
    lp = require('length-prefixed-stream').encode()
    lp.pipe(process.stdout)
  }
  process.stdout.once('error', function () {
    storage.close()
  })
  eyros({ storage, wasmSource }).then(async function (db) {
    var q = await db.query(bbox)
    var row
    var i = 0
    while (row = await q.next()) {
      if (format === 'lp') {
        lp.write(row[1])
      } else if (format === 'base64') {
        var b64 = Buffer.from(row[1]).toString('base64')
        process.stdout.write(b64+'\n')
      }
      i++
    }
    if (lp) lp.end()
    if (typeof storage.close === 'function') storage.close()
  })
} else if (argv._[0] === 'http') {
  var http = require('http')
  var Hyperdrive = require('hyperdrive')
  var hyperswarm = require('hyperswarm')
  var mime = require('mime')
  var u = argv._[1]
  var datadir = getDataDir()
  var m = /^hyper:[\/]*([^\/]+)/.exec(u)
  if (!m) return console.error('URI not yet supported')
  var file = path.join(datadir, m[1].replace(/[^A-Za-z0-9]+/g,'-'))
  var key = u.replace(/^hyper:[\/]*/,'')
  var swarm = hyperswarm()
  var drive = new Hyperdrive(file, key)
  var isOpen = false
  var openQueue = []
  function open() {
    isOpen = true
    for (var i = 0; i < openQueue.length; i++) {
      openQueue[i]()
    }
    openQueue = null
  }
  drive.once('ready', function () {
    swarm.join(drive.discoveryKey)
  })
  swarm.on('connection', function (socket, info) {
    pump(socket, drive.replicate(info.client), socket, function (err) {
      if (!closed) console.error('error=',err)
    })
    if (!isOpen) open()
  })

  var server = http.createServer(function handler(req, res) {
    if (!argv.quiet) console.log(req.method, req.url)
    if (!isOpen) return openQueue.push(function () { handler(req, res) })
    // todo: etag, if-modified-since, and head requests
    if (req.method === 'GET') {
      var ct = mime.getType(path.extname(req.url)) || 'application/octet-stream'
      res.setHeader('content-type', ct)
      res.setHeader('access-control-allow-origin', '*')
      res.setHeader('access-control-allow-methods', 'GET')
      res.setHeader('access-control-allow-headers', [
        'content-type', 'range', 'user-agent', 'x-requested-with'
      ])
      res.setHeader('access-control-expose-headers', [
        'content-range', 'x-chunked-output', 'x-stream-output'
      ])
      drive.open(req.url, 'r', function (err, fd) {
        if (err) {
          res.statusCode = 500
          res.setHeader('content-type', 'text/plain')
          res.end('error: ' + err)
          return
        }
        drive.stat(req.url, { wait: true }, function (err, stat) {
          if (err) {
            res.statusCode = 500
            res.setHeader('content-type', 'text/plain')
            res.end('error: ' + err)
            return
          }
          var buf = Buffer.alloc(stat.size)
          drive.read(fd, buf, 0, stat.size, 0, function (err) {
            if (err) {
              res.statusCode = 500
              res.setHeader('content-type', 'text/plain')
              res.end('error: ' + err)
            } else {
              res.end(buf)
            }
          })
        })
      })
    } else {
      res.statusCode = 404
      res.setHeader('content-type', 'text/plain')
      res.end('not found')
    }
  })
  server.listen(argv.port || 8081)
}

function getDataDir() {
  if (argv.datadir !== undefined) return argv.datadir
  if (env.PEERMAPS_DATADIR) return env.PEERMAPS_DATADIR
  var home = env.XDG_DATA_HOME || env.HOME
  return path.join(home, '.local/share/peermaps')
}
