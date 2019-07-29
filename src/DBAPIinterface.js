'use strict';

const Config = require('./config/config');

const axios = require('axios');

var log4js = require('log4js');
log4js.configure('./src/config/log4js.json');
var log = log4js.getLogger("app");


exports.Login = function (username, password, res, cb_succeed, cb_failed) {
    const url = Config.DB_API_URL + '/users/login';

    var data = { username: username, password: password };

    // log.debug(`** ${url}:${username}:${password}`);

    axios.post(url, data)
        .then(function (resNew) {
            // log.debug("** " + JSON.stringify(resNew.data, null, 2));
            cb_succeed(res, resNew.data.id);
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_failed(res, err.message);
        });
}

exports.Logout = function (access_token, res, cb_succeed, cb_failed) {
    const url = Config.DB_API_URL + '/users/logout?access_token=' + access_token;
    // log.debug(`** ${url}:${access_token}`);

    axios.post(url, null)
        .then(function (resNew) {
            // log.debug("** " + resNew.data);
            cb_succeed(res);
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_failed(res, err.message);
        });
}

exports.UserFindOne = function (username, cb_found, cb_not_found) {
    var query = JSON.stringify({
        where: { username: username }
    }, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

    const url = Config.DB_API_URL + `/users/findOne` + "?filter=" + encodeURIComponent(query) + "&access_token=" + Config.ACCESS_TOKEN;

    // log.debug(`** UserFindOne():${url}`);

    axios.get(url)
        .then(function (resNew) {
            // log.debug("** " + JSON.stringify(resNew.data, null, 2));
            cb_found(resNew.data);
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_not_found();
        });
}

exports.GetAccessTokens = function (userId, cb_found, cb_not_found) {
    var url = Config.DB_API_URL + `/users/${userId}/accessTokens?access_token=${Config.ACCESS_TOKEN}`;

    // log.debug("** GetAccessTokens():" + url);

    axios.get(url)
        .then(function (resNew) {
            // log.debug("** " + JSON.stringify(resNew.data, null, 2));
            cb_found(resNew.data);
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_not_found();
        });
}

exports.ConfigLimitsFindOne = function (username, cb_found, cb_not_found) {
    var query = JSON.stringify({
        where: { username: username }
    }, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

    const url = Config.DB_API_URL + `/config_limits/findOne` + "?filter=" + encodeURIComponent(query) + "&access_token=" + Config.ACCESS_TOKEN;

    // log.debug(`** GetConfigLimits():${url}`);

    axios.get(url)
        .then(function (resNew) {
            // log.debug("** " + JSON.stringify(resNew.data, null, 2));
            cb_found(resNew.data);
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            if (username == 'DefaultUser')
                cb_not_found();
            else
                exports.ConfigLimitsFindOne('DefaultUser', cb_found, cb_not_found);
        });
}

exports.UserUpdate = function (user, cb_succeed, cb_failed) {
    log.debug(`** UserUpdate()`);
    // log.debug("** " + JSON.stringify(user, null, 2));

    const url = Config.DB_API_URL + `/users/${user.id}?access_token=${Config.ACCESS_TOKEN}`;

    axios.patch(url, {
        'addSkinDataCount': user.addSkinDataCount,
        'upSkinDataCount': user.upSkinDataCount
    })
        .then((response) => {
            // log.debug(response.data);
            if (typeof cb_succeed != 'undefined')
                cb_succeed(response.data);
        })
        .catch(function (err) {
            // log.debug("*** UserUpdate() : " + err);
            if (typeof cb_failed != 'undefined')
                cb_failed(err.message);
        });
}

exports.SkinDataFind = function (query) {
    var encQuery = JSON.stringify({
        where: query.where,
        limit: query.limit,
        order: Object.keys(query.sort)[0] + " " + query.sort[Object.keys(query.sort)[0]]
    }, null, 2).replace(/(\r\n|\n|\r)/g, "").replace(/"/g, '\"');

    // log.debug("** " + JSON.stringify(encQuery, null, 2));

    const url = Config.DB_API_URL + `/skin_data` + "?filter=" + encodeURIComponent(encQuery) + "&access_token=" + Config.ACCESS_TOKEN;

    // log.debug(`** SkinDataFind():${url}`);

    return new Promise((resolve, reject) => {
        axios.get(url)
            .then(function (resNew) {
                // log.debug("** SkinDataFind() " + JSON.stringify(resNew.data, null, 2));
                if (resNew.data && resNew.data.length > 0)
                    resolve(resNew.data);
                else
                    resolve('Not found');
            })
            .catch(function (err) {
                // log.debug("*** SkinDataFind() " + err.message);
                resolve(err.message);
            });
    });
}

exports.SkinDataSave = function (skindata, cb_succeed, cb_failed) {
    log.debug(`** SkinDataSave()`);
    // log.debug("** SkinDataSave()" + JSON.stringify(skindata, null, 2));

    const url = Config.DB_API_URL + '/skin_data?access_token=' + Config.ACCESS_TOKEN;

    axios.post(url, skindata)
        .then(function (resNew) {
            // log.debug("** " + resNew.data);
            cb_succeed();
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_failed(err.message);
        });
}


exports.SaveTransLog = function (transLog, cb_succeed, cb_failed) {
    log.debug(`** SaveTransLog()`);
    // log.debug("** SaveTransLog()" + JSON.stringify(transLog, null, 2));

    const url = Config.DB_API_URL + '/transLogs?access_token=' + Config.ACCESS_TOKEN;

    axios.post(url, transLog)
        .then(function (resNew) {
            // log.debug("** " + resNew.data);
            cb_succeed();
        })
        .catch(function (err) {
            // log.debug("*** " + err.message);
            cb_failed(err.message);
        });
}