'use strict';

const Config = require('./config/config');

const Mongoose = require('mongoose');
const UserSchema = require('./mongo/user_schema');
const SkinDataSchema = require('./mongo/skindata_schema');

const DBAPIinterface = require('./DBAPIinterface');

var log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
var log = log4js.getLogger("app");


exports.Login = function (username, password, res, cb_succeed, cb_failed) {
    if (Config.USE_DB_API) {
        DBAPIinterface.Login(username, password, res, cb_succeed, cb_failed);
    }
    else {
        cb_succeed(res, 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    }
}

exports.Logout = function (access_token, res, cb_succeed, cb_failed) {
    if (Config.USE_DB_API) {
        DBAPIinterface.Logout(access_token, res, cb_succeed, cb_failed);
    }
    else {
        cb_succeed(res);
    }
}

exports.IsValidUser = function (username, password, access_token, cb_valid, cb_invalid) {
    log.debug(`dataInterface.IsValidUser():`);

    if (Config.USE_DB_API) {
        DBAPIinterface.UserFindOne(username,
            function (user) {
                DBAPIinterface.GetAccessTokens(user.id,
                    function (tokenArray) {
                        if (!tokenArray || !Array.isArray(tokenArray))
                            return cb_invalid();
                        else
                            cb_valid(user);
                    },
                    function () {
                        cb_invalid();
                    }
                );
            },
            function (res) {
                cb_invalid();
            }
        );
    }
    else {
        Mongoose.connect(Config.MONGODB_URI, Config.MONGODB_OPTIONS, function (err) {
            if (err)
                return res.status(500).json({ message: err });

            UserSchema.IsValidUser(username, password, cb_valid, cb_invalid);
        });
    }
}

exports.UserUpdate = function (user, cb_succeed, cb_failed) {
    log.debug(`dataInterface.UserUpdate():`);

    if (Config.USE_DB_API) {
        DBAPIinterface.UserUpdate(user, cb_succeed, cb_failed);
    }
    else {
        // user.updateOne({addSkinDataCount : user.addSkinDataCount + 1}).exec();
    }
}

exports.SkinDataFind = function (query) {
    log.debug(`dataInterface.SkinDataFind():`);

    if (Config.USE_DB_API) {
        return DBAPIinterface.SkinDataFind(query);
    }
    else {
        // Mongoose.connect(Config.MONGODB_URI, Config.MONGODB_OPTIONS, function(err) {
        //         if (err) 
        //           return cb_not_found(err);

        //         SkinDataSchema.findOne(query, function(err, skindata){
        //                 if (err)
        //                         return cb_not_found(err);

        //                 if (skindata)
        //                         return cb_found(skindata.created_at);
        //                 else
        //                         return cb_not_found('Not found.');
        //         });

        //         query = SkinDataSchema.find({status: 1, created_at: {$lt:createdAt}}).sort({'created_at': 'desc'}).limit(num_of_rows);

        //         query.exec(function(err, docs) {
        //         });
        // });
    }
}

exports.SkinDataSave = function (skindata, cb_succeed, cb_failed) {
    log.debug(`dataInterface.SkinDataSave():`);

    if (Config.USE_DB_API) {
        DBAPIinterface.SkinDataSave(skindata, cb_succeed, cb_failed);
    }
    else {
        // SkinDataSchema.Save(bl, user.institution_id, user.user_name, transaction_hash);
    }
}

exports.SaveTransLog = function (transLog, cb_succeed, cb_failed) {
    log.debug(`dataInterface.SaveTransLog():`);

    if (Config.USE_DB_API) {
        DBAPIinterface.SaveTransLog(transLog, cb_succeed, cb_failed);
    }
    else {
        // TransLogSchema.Save(transLog);
    }
}
