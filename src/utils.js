'use strict'

const URL = require('url').URL
const FS = require('fs')

module.exports = {
  fullUrl: function (req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl
  },

  long2val: function (data) {
    if (Array.isArray(data)) return data[0] + data[1] * 4294967296
    else return data.lower + data.higher * 4294967296
  },

  int2Hex: function (value) {
    return ('0000000' + ((value | 0) + 4294967296).toString(16)).substr(-8)
  },

  fmtCatapultValue: function (data) {
    if (data === null) {
      return
    }
    var o = this.long2val(data)
    if (!o) {
      o = 0
    } else {
      o = (o / 1000000).toFixed(6)
      // var b = o.toFixed(6).split('.');
      // var r = "<span class='sep'>" +b[0].split(/(?=(?:...)*$)/).join("</span><span class='sep'>") + "</span>";
      // o = r + ".<span class='dim'>" + b[1] + "</span>";
    }
    return o
  },

  fmtCatapultId: function (data) {
    if (data === null) {
      return
    }
    return '0x' + this.int2Hex(data.higher) + this.int2Hex(data.lower)
  },

  forEachLine: function (filepath, fn) {
    var bufSize = 64 * 1024
    var buf = new Buffer(bufSize)
    var leftOver = ''
    var lineNum = 0
    var lines, n
    var fd = FS.openSync(filepath, 'r')

    while ((n = FS.readSync(fd, buf, 0, bufSize, null)) !== 0) {
      // console.log("==== n : " + n );
      lines = buf.toString('utf8', 0, n).split(/\r?\n/)
      lines[0] = leftOver + lines[0] // add leftover string from previous read
      while (lines.length > 1) {
        // process all but the last line
        fn(lines.shift(), lineNum)
        lineNum++
      }
      leftOver = lines.shift() // save last line fragment (may be '')
    }

    // console.log("====1 n : " + n );
    // console.log("====1 leftOver : " + leftOver );

    if (leftOver) {
      // process any remaining line
      fn(leftOver, lineNum)
    }
  }
}
