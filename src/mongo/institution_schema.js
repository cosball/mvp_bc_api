var mongoose = require('mongoose');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var institutionSchema = new Schema({
  // The unique short name of the Vault's partner institution
  institutionShortName: { type: String, required: true, unique: true },
  // The institution/company name
  institutionName: { type: String, required: true, unique: true },
  // The institution/company address
  institutionAddress: { type: String, required: true, unique: false },
  // The NEM public key of the institution/company
  // nemAddress: { type: String, required: true, unique: true },
  // Institution Type: 'Main', 'Exchange', 'Bank', 'Financial', 'Government', 'Merchant', 'Others'
  institutionType: { type: String, required: true, unique: false },
  // Contact number of the institution/company
  contactNo: { type: String, required: true, unique: false },
  // Date/time this record was created
  createdAt: { type: Date, required: true, unique: false },
  // Date/time this record was last updated
  updatedAt: { type: Date, required: false, unique: false },
  // The user name of the one who created this record
  creator: { type: String, required: true, unique: false },
  // The user name of the one who updated this record
  updatedBy: { type: String, required: false, unique: false }
});


institutionSchema.statics.GetInstitution = function(institution_id, cb_found, cb_not_found) {
  console.log("institutionSchema.GetInstitution() " + institution_id);

  this.findOne({institution_id:institution_id}, function (err, institution) {
    if (err) return handleError(err);
    
    if (institution) {
      cb_found(institution);
    }
    else {
      cb_not_found();
    }
  });
};

var Institution = mongoose.model('Institution', institutionSchema, 'institution');

module.exports = Institution;
 