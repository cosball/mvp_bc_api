'use strict';

const utf8 = require('utf8');
const URL = require('url').URL;

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
    UInt64 = nem2Sdk.UInt64,
    QueryParams = nem2Sdk.QueryParams,
    PublicAccount = nem2Sdk.PublicAccount;

const FS = require('fs');
const CSVParse = require('csv-parse/lib/sync');
const utils = require('../utils');
const sha256 = require('sha256');
const DateFormat = require('dateformat');
const Excel = require('exceljs');

var log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
var log = log4js.getLogger("app");

const Config = require('../config/config');
const CheckAddressResult = require('../models/CheckAddressResult');
const GetBlock = require('../models/GetBlock');

const Mongoose = require('mongoose');
const UserSchema = require('../mongo/user_schema');
const SkinDataSchema = require('../mongo/skindata_schema');
const TranslogSchema = require('../mongo/translog_schema');

const DataInterface = require('../dataInterface');

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
    var tx_hash = req.body.tx_hash;
    var num_of_rows = typeof req.body.num_of_rows == "undefined" ? 1 : parseInt(req.body.num_of_rows);

    log.debug(`** ${username}:${password}:${access_token}:${tx_hash}:${num_of_rows}`);

    res.locals = TranslogSchema.Create("GetList", username, [tx_hash, num_of_rows]);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                res.locals.User(user);
                // log.debug("*--* " + JSON.stringify(user, null, 2));

                if (typeof tx_hash == "undefined") {
                    return get_address_list(res, user, num_of_rows, new Date("9999-12-31T23:59:00"));
                }
                else {
                    var query = {
                        where: { transactionHash: tx_hash },
                        sort: { 'createdAt': 'desc' },
                        limit: 1
                    };

                    DataInterface.SkinDataFind(query,
                        function (skindata) {
                            // log.debug("** " + JSON.stringify(skindata, null, 2));
                            return get_address_list(res, user, num_of_rows, skindata[0].createdAt);
                        },
                        function (err) {
                            return res.status(405).json({ error: { message: err } });
                        }
                    );
                }
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
                skindata['rewardPoint'] = Math.floor(Math.random() * (3 - 1) + 1);
                skindata['recommenedCosball'] = 'AA123';

                var hash = gen_data_hash(skindata);

                // log.debug("** " + JSON.stringify(bl_entry, null, 2));

                add_to_list(username, hash, skindata.rewardPoint,
                    function (transaction_hash) {
                        log.debug("TX Hash : " + transaction_hash);

                        var entry = SkinDataSchema.fromPostData(skindata);
                        entry.transactionHash = transaction_hash;
                        
                        DataInterface.SkinDataSave(entry,
                            function() {
                                return res.status(201).json(skindata);
                            },
                            function(err) {
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
exports.checkAddress = function (req, res) {
    log.debug(`checkAddress():`);

    var access_token = req.query.access_token ? req.query.access_token : req.headers.authorization;

    var address = req.params.address;
    var address_type = req.body.address_type;
    var username = req.query.requester ? req.query.requester : req.body.user_name;
    var password = req.body.password;

    log.debug(`** ${username}:${password}:${address}:${address_type}`);

    res.locals = TranslogSchema.Create("CheckAddress", username, [address, address_type]);

    DataInterface.IsValidUser(username, password, access_token,
        function (user) // Valid User
        {
            try {
                // log.debug("** " + JSON.stringify(user, null, 2));
                // log.debug("** " + JSON.stringify(config_limit, null, 2));
                res.locals.User(user);

                var query = {
                    where: { address: address, addressType: address_type },
                    sort: { 'createdAt': 'desc' },
                    limit: 1
                };

                DataInterface.SkinDataFind(query,
                    function (skindata) {
                        if (!skindata)
                            return res.status(404).json({ error: { message: 'Address not found.' } });

                        return res.status(200).json(skindata);

                        // const transactionHttp = new TransactionHttp(Config.NEM_API_URL);
                        // transactionHttp.getTransaction(skindata.transactionHash).subscribe(
                        //   transaction => return_checkAddress_result(res, transaction),
                        //   err => res.status(404).json({error:{ message: 'Invalid transaction hash:' + skindata.transactionHash }})
                        // );
                    },
                    function (err) {
                        return res.status(404).json({ error: { message: 'Address not found.' } });
                        // return res.status(405).json({ message: err });
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
                        transaction => return_checkAddress_result(res, transaction),
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



var gen_data_hash = function(data) {
    log.debug('gen_data_hash');

    log.debug(data);

    var text = JSON.stringify(data, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

    var hash = sha256(text).toUpperCase();

    log.debug('hash:' + hash);

    return hash;
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
var return_checkAddress_result = function (res, transaction) {
    log.debug('return_checkAddress_result: ');

    if (transaction == null)
        return res.status(404).json({ error: { message: 'Internal error occurred.' } });

    // log.debug("** " + JSON.stringify(transaction, null, 2));              

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
            quantity: utils.fmtCatapultValue(transaction.mosaics[i].amount)
        });
    }

    result.deadline = transaction.deadline.value;
    result.message = {
        message_type: transaction.message.type,
        data: transaction.message.payload
    };

    return res.status(200).json(result);
}

// Done
var get_address_list = function (res, user, num_of_rows, createdAt) {
    log.debug('get_address_list: ');

    var query;

    if (Config.USE_DB_API) {
        query = {
            where: { status: 1, createdAt: { lt: createdAt } },
            sort: { 'createdAt': 'desc' },
            limit: num_of_rows
        };
    }
    else {
        query = {
            where: { status: 1, createdAt: { $lt: createdAt } },
            sort: { 'createdAt': 'desc' },
            limit: num_of_rows
        };
    }

    DataInterface.SkinDataFind(query,
        function (docs) {
            if (docs.length == 0)
                return res.status(404).json({ error: { message: 'No skindata found.' } });

            return res.status(200).json(docs);
        },
        function (err) {
            return res.status(404).json([]);
        }
    );
};

// Done
var add_to_list = function (username, data_hash, reward, cb_success, cb_error) {
    log.trace(`add_to_list: ${username}:${data_hash}`);
    // log.debug(bl_entry);

    if (!username || !data_hash) {
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
        PlainMessage.create(data_hash),
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

