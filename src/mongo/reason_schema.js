var mongoose = require('mongoose');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var reasonSchema = new Schema({
  // Unique reason short name
  reasonShortName: { type: String, required: true, unique: true }, 
  // The reason description
  reasonDescription: { type: String, required: true, unique: true }
});

var Reason = mongoose.model('Reason', reasonSchema, 'reason');

module.exports = Reason;
 