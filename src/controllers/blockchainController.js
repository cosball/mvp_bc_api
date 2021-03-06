'use strict';


const operators = require('rxjs/operators');

const nem2Sdk = require("nem2-sdk");
const Account = nem2Sdk.Account,
    AccountHttp = nem2Sdk.AccountHttp,
    Address = nem2Sdk.Address,
    BlockHttp = nem2Sdk.BlockHttp,
    Deadline = nem2Sdk.Deadline,
    NetworkHttp = nem2Sdk.NetworkHttp,
    NetworkType = nem2Sdk.NetworkType,
    TransferTransaction = nem2Sdk.TransferTransaction,
    TransactionHttp = nem2Sdk.TransactionHttp,
    PlainMessage = nem2Sdk.PlainMessage,
    NetworkCurrencyMosaic = nem2Sdk.NetworkCurrencyMosaic,
    Mosaic = nem2Sdk.Mosaic,
    MosaicId = nem2Sdk.MosaicId,
    MosaicHttp = nem2Sdk.MosaicHttp,
    MosaicService = nem2Sdk.MosaicService,
    mergeMap = operators.mergeMap,
    UInt64 = nem2Sdk.UInt64,
    QueryParams = nem2Sdk.QueryParams,
    Order = nem2Sdk.Order,
    PublicAccount = nem2Sdk.PublicAccount;

const utils = require('../utils');
const sha256 = require('sha256');
var crypto = require('crypto');

var log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
var log = log4js.getLogger("app");

const Config = require('../config/config');
const CheckAddressResult = require('../models/CheckAddressResult');
const GetBlock = require('../models/GetBlock');

const SkinDataSchema = require('../mongo/skindata_schema');
const TranslogSchema = require('../mongo/translog_schema');

const DataInterface = require('../dataInterface');

exports.signup = function (req, res) {
    log.debug(`signup():`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;
    var username = req.body.username;
    var encToken = req.body.token;

    // log.debug(`** ${username}:${password}`);

    try {
        if (!encToken) {
            return res.status(400).json({ error: { message: 'Invalid request' } });
        }

        var token = decryptToken(encToken);
        if (!token) {
            return res.status(400).json({ error: { message: 'Invalid request' } });
        }

        var textParts = token.split(',');
        // console.log("*** " + username + "," + access_token)
        // console.log("*** " + textParts[2] + "," + textParts[0])
        // console.log(Date.now() - textParts[1]);
        if (textParts[2] !== username || access_token !== textParts[0] || Date.now() - textParts[1] > 60000) {
            return res.status(400).json({ error: { message: 'Invalid request' } });
        }

        var signupData = { username: username, rewardPoint: Math.floor(Math.random() * (3) + 1) };

        // console.log("Success");
        // return res.status(201).json(signupData);

        var hash = gen_data_hash(signupData);
        var nemData = { tx_type: 'Signup', hash: hash };
        var dataJson = JSON.stringify(nemData, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

        // log.debug("** " + JSON.stringify(nemData, null, 2));

        add_to_nem(username, dataJson, signupData.rewardPoint,
            function (transaction_hash) {
                log.debug("TX Hash : " + transaction_hash);

                signupData['tx_hash'] = transaction_hash;

                return res.status(201).json(signupData);
            },
            function (err) {
                return res.status(400).json({ error: { message: 'Invalid data:' + err } });
            }
        );
    }
    catch (e) {
        res.status(500).json({ error: { message: 'Error:' + e } });
    }
}

exports.balance = function (req, res) {
    log.debug(`balance():`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;

    log.debug(`** ${username}:${password}:${access_token}`);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                // log.debug("*--* " + JSON.stringify(user, null, 2));

                const url = Config.NEM_API_URL;
                const accountHttp = new AccountHttp(url);
                const mosaicHttp = new MosaicHttp(url);
                const mosaicService = new MosaicService(accountHttp, mosaicHttp);

                var usernameHash = sha256((username)).toUpperCase();
                log.debug("PublicKey : " + usernameHash);
                const address = Address.createFromPublicKey(usernameHash, NetworkType.MIJIN_TEST);

                mosaicService
                    .mosaicsAmountViewFromAddress(address)
                    .pipe(
                        mergeMap((_) => _)
                    )
                    .subscribe(mosaic => res.status(200).json({ address: usernameHash, balance: mosaic.relativeAmount() * 1000000 }),
                        err => res.status(500).json({ error: { message: 'Error:' + err } })
                    );
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(400).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
}

exports.login = function (req, res) {
    log.debug(`login():`);

    var username = req.body.username;
    var password = req.body.password;

    // log.debug(`** ${username}:${password}`);

    DataInterface.Login(username, password, res,
        function (res, access_token) {
            return res.status(200).json({ access_token: access_token });
        },
        function (res, errMesg) {
            return res.status(401).json({ error: { message: errMesg } });
        }
    );
}

exports.logout = function (req, res) {
    log.debug(`logout():`);

    var access_token = req.params.access_token;

    log.debug(`** ${access_token}`);

    DataInterface.Logout(access_token, res,
        function (res) {
            return res.status(201).json({ error: { message: 'Logout successful' } });
        },
        function (res, errMesg) {
            return res.status(401).json({ error: { message: errMesg } });
        }
    );
}

// Done
exports.getList = function (req, res) {
    log.debug(`getList(): ${req.url}`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;
    var tx_hash = req.query.tx_hash ? req.query.tx_hash : req.body.tx_hash;
    var order = req.query.order ? req.query.order : req.body.order;
    var num_of_rows = req.query.num_of_rows ? req.query.num_of_rows : req.body.num_of_rows;
    num_of_rows = num_of_rows ? parseInt(num_of_rows) : 1;

    log.debug(`** ${username}:${password}:${access_token}:${tx_hash}:${num_of_rows}`);

    res.locals = TranslogSchema.Create("GetList", username, [tx_hash, num_of_rows]);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                res.locals.User(user);
                // log.debug("*--* " + JSON.stringify(user, null, 2));

                get_tx_list(username, num_of_rows, tx_hash, order, function (transData) {
                    var promiseArr = [];

                    for (const [index, trans] of transData.entries()) {
                        // log.info(trans);
                        var query = {
                            where: { transactionHash: trans.transaction_hash },
                            sort: { 'createdAt': 'desc' },
                            limit: 1
                        }

                        promiseArr.push(DataInterface.SkinDataFind(query));
                    }

                    Promise.all(promiseArr)
                        .then(function (values) {
                            var retArr = [];
                            for (const [index, data] of values.entries()) {
                                if (data.length > 0 && typeof data[0] != "string")
                                    retArr.push(data[0]);
                            }
                            // log.debug(values);
                            res.status(200).json(retArr);
                        });
                });
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(400).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
};

// Done
exports.transactionList = function (req, res) {
    log.debug(`transactionList(): ${req.url}`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;
    var tx_hash = req.query.tx_hash ? req.query.tx_hash : req.body.tx_hash;
    var order = req.query.order ? req.query.order : req.body.order;
    var num_of_rows = req.query.num_of_rows ? req.query.num_of_rows : req.body.num_of_rows;
    num_of_rows = num_of_rows ? parseInt(num_of_rows) : 1;

    log.debug(`** ${username}:${password}:${access_token}:${tx_hash}:${num_of_rows}`);

    res.locals = TranslogSchema.Create("GetList", username, [tx_hash, num_of_rows]);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                res.locals.User(user);
                // log.debug("*--* " + JSON.stringify(user, null, 2));

                get_tx_list(username, num_of_rows, tx_hash, order, function (transData) {
                    for(const [index, trans] of transData.entries()) {
                        // Convert deadline(localtime) to UTC
                        // ToDO: need to calculate time with system timezone offset
                        trans.deadline = trans.deadline.minusHours(10) + "Z";
                    }
                    res.status(200).json(transData);
                });
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(400).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
};

// Done
exports.addSkinData = function (req, res) {
    log.debug(`addSkinData():${req.url}`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var address = req.params.address;
    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;
    var skindata = JSON.parse(req.body.skindata);

    log.debug(`** ${username}:${password}:${skindata.location}:${skindata.weather}`);

    var transactionType = 'AddSkinData';
    if (/\/update\//.test(req.url))
        transactionType = 'UpdateSkinData';

    log.info(`transactionType : ${transactionType}`)
    res.locals = TranslogSchema.Create(transactionType, username, JSON.stringify(skindata, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"'));

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                // log.debug("** " + JSON.stringify(user, null, 2));
                // log.debug("** " + JSON.stringify(config_limit, null, 2));
                // log.debug("** " + JSON.stringify(skindata, null, 2));
                res.locals.User(user);

                skindata['createdAt'] = Date.now();
                skindata['username'] = username;
                skindata['rewardPoint'] = Math.floor(Math.random() * (3) + 1);
                skindata['recommenedCosball'] = find_cosball_product(skindata);

                var hash = gen_data_hash(skindata);
                var nemData = { tx_type: 'SkinData', hash: hash };
                var dataJson = JSON.stringify(nemData, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

                // log.debug("** " + JSON.stringify(nemData, null, 2));

                add_to_nem(username, dataJson, skindata.rewardPoint,
                    function (transaction_hash) {
                        log.debug("TX Hash : " + transaction_hash);

                        var entry = SkinDataSchema.fromPostData(skindata);
                        entry.transactionHash = transaction_hash;

                        DataInterface.SkinDataSave(entry,
                            function () {
                                return res.status(201).json(skindata);
                            },
                            function (err) {
                                return res.status(500).json({ error: { message: 'Error:' + err } });
                            }
                        );
                    },
                    function (err) {
                        return res.status(400).json({ error: { message: 'Invalid data:' + err } });
                    }
                );
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(403).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
};


// Done
exports.getTransaction = function (req, res) {
    log.debug(`getTransaction(): ${req.url}`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var transaction_hash = req.params.transaction_hash;
    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;

    log.debug(`** ${username}:${password}:${transaction_hash}`);

    res.locals = TranslogSchema.Create("GetTransaction", username, transaction_hash);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                // log.debug("** " + JSON.stringify(user, null, 2));
                // log.debug("** " + JSON.stringify(config_limit, null, 2));
                res.locals.User(user);

                const transactionHttp = new TransactionHttp(Config.NEM_API_URL);
                transactionHttp.getTransaction(transaction_hash)
                    .subscribe(
                        transaction => return_getTransaction_result(res, transaction),
                        err => res.status(404).json({ error: { message: 'Transaction not found:' + transaction_hash } })
                    );
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(403).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
};

exports.getBlock = function (req, res) {
    log.debug(`getBlock():`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var block = req.params.block;
    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;

    log.debug(`** ${username}:${password}:${access_token}:${block}`);

    res.locals = TranslogSchema.Create("GetBlock", username, block);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                // log.debug("** " + JSON.stringify(user, null, 2));
                // log.debug("** " + JSON.stringify(config_limit, null, 2));
                res.locals.User(user);

                const blockHttp = new BlockHttp(Config.NEM_API_URL);
                blockHttp.getBlockByHeight(block)
                    .subscribe(
                        block => return_getBlock_result(res, blockHttp, block),
                        err => res.status(404).json({ error: { message: 'Block not found:' + block } })
                    );
            }
            catch (e) {
                res.status(500).json({ error: { message: 'Error:' + e } });
            }
        },
        function () // Invalid User
        {
            return res.status(403).json({ error: { message: 'Invalid user_name or password.' } });
        }
    );
};



var gen_data_hash = function (data) {
    log.debug('gen_data_hash');

    log.debug(data);

    var text = JSON.stringify(data, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

    var hash = sha256(text).toUpperCase();

    log.debug('hash:' + hash);

    return hash;
}

var find_cosball_product = function (skindata) {
    log.debug('find_cosball_product');

    var first = String.fromCharCode(Math.floor(skindata.temperature + skindata.humidity + skindata.pressure / 100) % 26 + 65);
    var second = skindata.weather.toUpperCase()[0];
    var num = Math.abs(700 - (skindata.moisture + skindata.oil + skindata.pore + (skindata.skinTemperature * 3) + skindata.skinTone + skindata.wrinkle));

    var dataArr = [
        { code: 'A', value: skindata.moisture },
        { code: 'B', value: skindata.oil },
        { code: 'C', value: skindata.pore },
        { code: 'D', value: skindata.skinTemperature },
        { code: 'E', value: skindata.skinTone },
        { code: 'F', value: skindata.wrinkle }
    ];
    dataArr.sort((a, b) => a.value - b.value);

    var products = [];
    for (var i = 0; i < 4; i++) {
        products.push(dataArr[i].code + (Math.floor(dataArr[i].value / 20) + 1))
    }

    products.sort((a, b) => {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }

        return 0;
    });

    return products.join(',');
}

// Done
var return_getBlock_result = function (res, blockHttp, block) {
    log.debug('return_getBlock_result: ');

    if (block == null)
        return res.status(500).json({ error: { message: 'Internal error occurred.' } });

    // log.debug("** " + JSON.stringify(block, null, 2));              

    var result = new GetBlock.Result();

    result.block = utils.long2val(block.height);
    result.difficulty = (utils.long2val(block.difficulty) / 1000000000000).toFixed(2);

    var millis = utils.long2val(block.timestamp) + 1459468800000; // epochTimestamp
    var d = new Date(0);
    d.setUTCMilliseconds(millis);
    result.timestamp = d.toUTCString();

    result.block_hash = block.hash;
    result.harvester = block.signer.publicKey;
    result.num_trans = block.numTransactions;
    result.state_data = '';
    result.state_hash = block.stateHash;
    result.sub_cache_mroots = '';

    blockHttp.getBlockTransactions(result.block)
        .subscribe(
            transactions => return_getBlock_transactions(res, result, transactions),
            err => return_getBlock_transactions(res, result, null)
        );
}

var return_getBlock_transactions = function (res, result, transactions) {
    // log.debug("** " + JSON.stringify(transactions, null, 2));

    var array = [];
    for (var i = 0; transactions != null && i < transactions.length; i++) {
        var trans = new GetBlock.Transaction();
        trans.signer = transactions[i].signer.publicKey;
        trans.height = result.block;
        trans.deadline = transactions[i].deadline.value;
        array.push(trans);
    }

    result.transactions = array;

    return res.status(200).json(result);
}

// Done
var return_getTransaction_result = function (res, transaction) {
    log.debug('return_getTransaction_result: ');

    if (transaction == null)
        return res.status(404).json({ error: { message: 'Internal error occurred.' } });

    // log.debug("** " + JSON.stringify(transaction, null, 2));   

    console.log(transaction);

    var result = new CheckAddressResult();

    result.block = transaction.transactionInfo.height.lower;
    result.transaction_hash = transaction.transactionInfo.hash;
    result.sender_pubkey = transaction.signer.publicKey;
    result.recipient_addr = transaction.recipient.address;

    //  utils.fmtCatapultValue
    result.mosaics = [];
    for (var i = 0; i < transaction.mosaics.length; i++) {
        result.mosaics.push({
            mosaic_id: utils.fmtCatapultId(transaction.mosaics[i].id.id),
            quantity: utils.fmtCatapultValue(transaction.mosaics[i].amount) * 1000000
        });
    }

    log.debug(transaction.deadline.value);
    result.deadline = transaction.deadline.value;
    result.message = {
        message_type: transaction.message.type,
        data: transaction.message.payload
    };

    return res.status(200).json(result);
}

var find_tx_id = function (tx_hash) {
    return new Promise((resolve, reject) => {
        if (!tx_hash)
            resolve(null);

        const transactionHttp = new TransactionHttp(Config.NEM_API_URL);
        transactionHttp.getTransaction(tx_hash)
            .subscribe(
                transaction => resolve(transaction.transactionInfo.id),
                err => resolve(null)
            );
    });
}

// Done
var get_tx_list = function (username, num_of_rows, tx_hash, order, callback) {
    log.debug('get_tx_list: ');

    const accountHttp = new AccountHttp(Config.NEM_API_URL);

    const publicKey = sha256((username)).toUpperCase();
    const publicAccount = PublicAccount.createFromPublicKey(publicKey, NetworkType.MIJIN_TEST);

    const pageSize = num_of_rows; // Page size between 10 and 100, otherwise 10

    find_tx_id(tx_hash).then(
        function (tx_id) {
            log.debug("tx_id:" + tx_id);
            log.debug("order:" + order);

            var nemQuery = new QueryParams(pageSize, tx_id, Order.DESC);

            accountHttp
                .transactions(publicAccount, nemQuery)
                .subscribe((transactions, err) => {
                    if (err) {
                        res.json({ error: true, message: err.replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\\"') });
                    }
                    else {
                        var retArr = [];
                        for (const [index, el] of transactions.entries()) {
                            // console.log(`get_list: ${element.message.payload}`);
                            try {
                                //   log.info(el);
                                var transInfo = {
                                    transaction_hash: el.transactionInfo.hash,
                                    amount: utils.fmtCatapultValue(el.mosaics[0].amount) * 1000000,
                                    deadline: el.deadline.value,
                                    message: JSON.parse(el.message.payload)
                                };

                                retArr.push(transInfo)
                            }
                            catch (error) {
                                // Ignore error for now
                            }
                        }

                        // console.log(`get_list: ${retArr}`);
                        callback(retArr);
                    }
                });
        }
    )
};

// Done
var add_to_nem = function (username, dataJson, reward, cb_success, cb_error) {
    log.trace(`add_to_nem: ${username}:${dataJson}`);
    // log.debug(bl_entry);

    if (!username || !dataJson) {
        cb_error("Invalid data");
        return;
    }

    // 01 result.Create Transfer Transaction
    var receiverHash = sha256((username)).toUpperCase();
    log.debug("PublicKey : " + receiverHash);
    const recipientAddress = Address.createFromPublicKey(receiverHash, NetworkType.MIJIN_TEST);

    const transferTransaction = TransferTransaction.create(
        Deadline.create(),
        recipientAddress,
        [new Mosaic(new MosaicId(Config.MOSAIC_ID), UInt64.fromUint(reward))],
        PlainMessage.create(dataJson),
        NetworkType.MIJIN_TEST);

    // 02 result.Signing the transaction
    var signereHash = Config.NEM_MASTER_KEY;
    log.debug("Private Key : " + signereHash);
    const account = Account.createFromPrivateKey(signereHash, NetworkType.MIJIN_TEST);
    const signedTransaction = account.sign(transferTransaction);

    // 03 result.Announcing the transaction
    const transactionHttp = new TransactionHttp(Config.NEM_API_URL);

    transactionHttp
        .announce(signedTransaction)
        .subscribe(x => cb_success(signedTransaction.hash), err => cb_error(err));
};

const ENCRYPTION_KEY = 'Writing objects: 100% (5/5), 600';
function decryptToken(text) {
    // console.log('decrypt:' + text)
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
