'use strict'

module.exports = function (app) {
    var blockchain = require('../controllers/blockchainController')

    var nem = require('../controllers/nemController')

    var basePath = '/blockchain'

    // vault Routes
    app.route(basePath + '/account/signup').post(blockchain.signup)
    app.route(basePath + '/account/balance').get(blockchain.balance)

    app.route(basePath + '/login').post(blockchain.login)

    app.route(basePath + '/logout/:access_token').post(blockchain.logout)


    app
    .route(basePath + '/skin_data/get/:transaction_hash')
    .get(blockchain.getTransaction)

    app.route(basePath + '/block/:block').get(blockchain.getBlock)

    app.route(basePath + '/skin_data/').get(blockchain.getList)

    app.route(basePath + '/skin_data/add').post(blockchain.addSkinData)
    
    app.route(basePath + '/transactions/').get(blockchain.transactionList)


    app
        .route(
        basePath +
            '/statistics/count/:count/grouping/:grouping'
    ).get(nem.getStatistics)
}
