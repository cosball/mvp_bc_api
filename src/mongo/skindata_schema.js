var mongoose = require('mongoose');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var skindataSchema = new Schema({
  location: { type: String, required: true, unique: false },
  weather: { type: String, required: true, unique: false},
  temperature: { type: Number, required: true, unique: false },
  humidity: { type: String, required: true, unique: false },
  pressure: { type: String, required: true, unique: false },
  moisture: { type: Number, required: false, unique: false },
  oil: { type: Number, required: false, unique: false },
  pore: { type: Number, required: false, unique: false },
  skinTemperature: { type: Number, required: false, unique: false },
  skinTone: { type: Number, required: false, unique: false },
  wrinkle: { type: Number, required: false, unique: false },
  rewardPoint: { type: Number, required: true, unique: false },
  recommenedCosball: { type: String, required: true, unique: false },
  transactionHash: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true, unique: false },
});

skindataSchema.statics.fromPostData = function(data)
{
  var entry = new SkinDataSchemaModel();
  
  entry.location = data.location;
  entry.weather = data.weather;
  entry.temperature = data.temperature;
  entry.humidity = data.humidity;
  entry.pressure = data.pressure;
  entry.moisture = data.moisture;
  entry.oil = data.oil;
  entry.pore = data.pore;
  entry.skinTemperature = data.skinTemperature;
  entry.skinTone = data.skinTone;
  entry.wrinkle = data.wrinkle;
  entry.rewardPoint = data.rewardPoint;
  entry.recommenedCosball = data.recommenedCosball;
  entry.createdAt = data.createdAt;

  return entry;
};


var SkinDataSchemaModel = mongoose.model('SkinData', skindataSchema, 'skin_data');

module.exports = SkinDataSchemaModel;
