var mongoose = require('mongoose');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var configLimitsSchema = new Schema({
  // The user name where the config limits are imposed
  // There should be a user name called 'DefaultUser' where limit is applicable
  // when a user is not defined in this config limit collection
  username: { type: String, required: true, unique: true},
  // Limit on the number of skindata addresses to be manually added by a user
  addSkinDataLimit: { type: Number, required: true, unique: false },
  // Limit on the number of uploads to be executed by a user
  upSkinDataLimit: { type: Number, required: true, unique: false},
  createdAt: { type: Date, required: true, unique: false },
  // Date/time when this record was last updated
  updatedAt: { type: Date, required: false, unique: false },
  // The user name who created this record
  creator: { type: String, required: true, unique: false },
  // The user name who updated this record
  updatedBy: { type: String, required: false, unique: false },
  // Date/time the user last logged in
});


configLimitsSchema.statics.GetConfigLimit = function(user_name, cb_found, cb_not_found) {
  console.log("configLimitsSchema.GetConfigLimit() " + user_name);

  ConfigLimits.findOne({user_name: user_name}, function (err, config_limit) {
    if (err) return handleError(err);
    if (config_limit) {
      cb_found(config_limit)
    }
    else {
      ConfigLimits.findOne({ user_name: 'DefaultUser'}, function (err, config_limit) {
        if (err) return handleError(err);
        if (config_limit) {
          cb_found(config_limit)
        }
        else {
          cb_not_found();
        }
      });
    }
  });
};

var ConfigLimits = mongoose.model('ConfigLimits', configLimitsSchema, 'config_limit');

module.exports = ConfigLimits;
