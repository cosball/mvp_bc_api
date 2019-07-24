var mongoose = require('mongoose');

const ObjectId = Schema.Types.ObjectId;

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var transAccessSchema = new Schema({
  /* The type of transaction
     THe following is the set of ransaction types:   
      Login
      Signup
      ContactUs
      ForgotPassword
      ResetPassword
      AddUser
      EditUser
      DeleteUser
      AddInstitution
      EditInstitution
      DeleteInstitution
      GetUser
      GetUsers
      ResendEmail 
      SearchByHash
      SearchByAddress
      GetSkinDatas
      GetActivityLog
      GetLogDetails
      GetBlockActivity
      GetBlockDetails
      AddSkinData
      UploadSkinData
      UpdateSkinData
  */  
  transactionType: { type: String, required: true, unique: true },
  // Transactions control defines who has access to these transactions based on the user's role type
  // Transaction Control: 'All', Super', 'Admin'  
  transactionControl: { type: String, required: true, unique: false },
  // Date/time this record was created
  createdAt: { type: Date, required: true, unique: false },
  // Date/time this record was updated
  updatedAt: { type: Date, required: false, unique: false },
  // The user name of the one who created this record
  creator: { type: String, required: true, unique: false },
  // The user name of the one who updated this record
  updatedBy: { type: String, required: false, unique: false }
});

var TransAccess = mongoose.model('TransAccess', transAccessSchema, 'trans_access');

module.exports = TransLog;