#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var env = process.env
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { d: 'datadir', v: 'version', f: 'format' }
})

if (argv.help || argv._[0] === 'help') {
  console.log(`
    usage: ${process.argv[0]} COMMAND ...

      query URI - list all features that intersect BBOX

        URI is a hyper://, ipfs://, or https?:// link to the peermaps dataset
        BBOX is in west,south,east,north form.

        -f FORMAT   - display results in FORMAT: base64 (default), lp
        --bbox=BBOX - list all features that intersect BBOX

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
}

function getDataDir() {
  if (argv.datadir !== undefined) return argv.datadir
  if (env.PEERMAPS_DATADIR) return env.PEERMAPS_DATADIR
  var home = env.XDG_DATA_HOME || env.HOME
  return path.join(home, '.local/share/peermaps')
}
