'use strict'

const utf8 = require('utf8')
const utils = require('../utils')

var log4js = require('log4js')
log4js.configure('./src/config/log4js.json')
var log = log4js.getLogger('app')

const Config = require('../config/config')
const axios = require('axios')

const DataInterface = require('../dataInterface')
const TranslogSchema = require('../mongo/translog_schema')

exports.getStatistics = function (req, res) {
    //  log.trace(`getStatistics():${req.url}`)

    var access_token = req.query.access_token
        ? req.query.access_token
        : req.headers.authorization
    var username = req.query.requester ? req.query.requester : req.body.user_name
    var password = req.body.password

    // /nem/statistics/from/:startHeight/to/:endHeight/grouping/:grouping
    var count = parseInt(req.params.count, 10)
    var grouping = parseInt(req.params.grouping, 10)

    count = count < 100 ? 100 : count
    count = count > 300 ? 300 : count

    //  log.debug(`** ${username}:${password}:${access_token}:${count}:${grouping}`)

    // res.locals = TranslogSchema.Create('GetStatistics', username, [
    //   count,
    //   grouping
    // ])

    try {
        getJson(
            '/chain/height',
            function (items) {
                var endHeight = items.height[0]
                //        log.debug(items.height[0])

                var startHeight = endHeight - count

                //        log.debug(`** ${startHeight}:${endHeight}:${grouping}`)

                var topHeight = items.height[0]
                if (
                    isNaN(startHeight) ||
                    isNaN(endHeight) ||
                    endHeight > topHeight ||
                    endHeight < startHeight + 60
                ) {
                    return
                }

                if (isNaN(grouping)) grouping = 60

                grouping = Math.min(Math.max(1, grouping), endHeight - startHeight)

                getJson(
                    '/diagnostic/storage',
                    function (items) {
                        getBlockStats(res, {
                            startHeight,
                            endHeight,
                            topHeight,
                            grouping
                        })
                    },
                    function (err) {
                        res.status(500).json({ error: { message: 'Error:' + err } })
                    }
                )
            },
            function (err) {
                res.status(500).json({ error: { message: 'Error:' + err } })
            }
        )
    } catch (e) {
        res.status(500).json({ error: { message: 'Error:' + e } })
    }
}

function getBlockStats(res, options) {
    // log.trace('getBlockStats()')

    var blockCount = options.endHeight - options.startHeight + 1
    getJson(
        `/diagnostic/blocks/${options.startHeight}/limit/${blockCount}`,
        function (items) {
            var heights = items.map(function (obj) {
                return utils.long2val(obj.block.height)
            })
            var timestamps = items.map(function (obj) {
                return utils.long2val(obj.block.timestamp)
            })

            for (var i = 0; i < timestamps.length - 1; ++i) {
                timestamps[i] -= timestamps[i + 1]
            }

            var grouping = options.grouping

            var averages = []
            var sum = 0
            for (var i = 0; i < grouping; ++i) {
                sum += timestamps[i]
            }
            for (var i = grouping; i < timestamps.length; ++i) {
                averages.push(sum / grouping)
                sum -= timestamps[i - grouping]
                sum += timestamps[i]
            }
            averages.push(0)

            var labels = [
                'Time Difference (in seconds)',
                `Avg Time Difference (per ${grouping} blocks)`
            ]

            var rows = []

            for (var i = 0; i < timestamps.length - 1; ++i) {
                // rows.push([heights[i], timestamps[i] / 1000, averages[i] / 1000])
                heights[i] = parseFloat(heights[i].toFixed(3))
                timestamps[i] = parseFloat((timestamps[i] / 1000).toFixed(3))
                averages[i] = parseFloat((averages[i] / 1000).toFixed(3))
            }

            heights.pop()
            timestamps.pop()
            averages.pop()

            res.status(200).json({
                title: `Block time differences (last ${heights.length} blocks)`,
                labels: labels,
                // data: rows
                averages: averages.reverse(),
                heights: heights.reverse(),
                timestamps: timestamps.reverse()
            })
        },
        function (err) {
            res.status(500).json({ error: { message: 'Error:' + err } })
        }
    )
}

function getJson(path, cb_succeed, cb_failed) {
    log.trace('getJson()')

    const url = Config.NEM_API_URL + path
    // const url = 'http://13.125.208.134:3000' + path

    log.debug(`** ${url}`)

    axios
        .get(url)
        .then(function (res) {
            // log.debug('** getJson() ' + JSON.stringify(res.data, null, 2))
            cb_succeed(res.data)
        })
        .catch(function (err) {
            // log.debug('*** getJson() ' + err.message)
            cb_failed(err.message)
        })
}
