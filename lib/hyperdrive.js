var path = require('path')
path.posix = path // work-around for https://github.com/andrewosh/mountable-hypertrie/pull/5

var Hyperdrive = require('hyperdrive')
var hyperswarm = require('hyperswarm')
var pump = require('pump')

module.exports = function (storage, key) {
  key = key.replace(/^hyper:[\/]*/,'')
  var drive = new Hyperdrive(storage, key)
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
  var swarm = hyperswarm()
  var closed = false
  swarm.on('connection', function (socket, info) {
    pump(socket, drive.replicate(info.client), socket, function (err) {
      if (!closed) console.error('error=',err)
    })
    if (!isOpen) open()
  })
  var storageFn = function (name) {
    return {
      write: function (offset, buf, cb) {
        cb(new Error('write not implemented'))
      },
      truncate: function (length, cb) {
        cb(new Error('truncate not implemented'))
      },
      del: function (cb) {
        cb(new Error('del not implemented'))
      },
      sync: function (cb) {
        cb(new Error('sync not implemented'))
      },
      length: function f (cb) {
        if (!isOpen) {
          return openQueue.push(function () { f(cb) })
        }
        drive.stat(name, { wait: true }, function (err, stat) {
          if (err) cb(err)
          else cb(null, stat.size)
        })
      },
      read: function f (offset, length, cb) {
        if (!isOpen) {
          return openQueue.push(function () { f(offset, length, cb) })
        }
        drive.open(name, 'r', function g (err, fd) {
          if (err) return cb(err)
          var buf = Buffer.alloc(length)
          drive.read(fd, buf, 0, length, offset, function (err) {
            if (err) return cb(err)
            cb(err, buf)
          })
        })
      },
    }
  }
  storageFn.close = function () {
    closed = true
    swarm.destroy()
  }
  return storageFn
}
