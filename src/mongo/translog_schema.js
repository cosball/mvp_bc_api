var mongoose = require('mongoose');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var translogSchema = new Schema({
  // The type of transaction. The following are the valid transaction types:
  /* Transaction Types:   
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
  transactionType: { type: String, required: true, unique: false },
  description: {type: String, requried: false, unique: false },
  // The login/signup specific transaction data
  loginSignup: { user_name: String },
  // Forgot password specific transaction data
  forgotPasswd: { email: String },
  // Contac us specific transaction data
  contactUs: { name: String, email: String, message: String, category: String, attachment: Buffer },
  // Reset password specific transaction data
  resetPasswd: { user_name: String },
  // Add user specific transaction data
  addUser: { user_name: String },
  // Edit user specific transaction data
  editUser: { user_name: String },
  // Delete user specific transaction data
  delUser: { user_name: String },
  // Add institution specific transaction data
  addInstitution: { institution_id: String },
  // Edit institution specific transaction data
  editInstitution: { institution_id: String },
  // Delete institution specific transaction data
  delInstitution: { institution_id: String },
  // Get user specific transaction data
  getUser: { user_name: String },
  // Search by hash specific transaction data
  searchByHash: { transaction_hash: String },
  // Search by address specific transaction data
  searchByAddress: { address: String },
  // Get activity details specific transaction data
  getActivityDetails: {transaction_id_hash: String},
  // Get block activity details specific transaction data
  getBlockDetails: {block: Number},
  // Add skindata specific transaction data
  addSkinData: { address: String, address_type: String, reason: String, remark: String, status: Number },
  // Update skindata specific transaction data
  updateSkinData: { address: String, address_type: String, reason: String, remark: String, status: Number },
  // Date/time this transaction was logged
  createdAt: { type: Date, required: true, unique: false },
  // The user name who initiated this transaction
  creator: { type: String, required: true, unique: false },
  // The result/error of this transaction 
  result: { type: String, required:true, unique: false},
  // The transaction hash of blockchain specific calls (Add/Update/Upload skindata)
  transactionHash : { type: String, required: false, unique: true},
  // The blockchain data of the blockchain specific calls (Add/Update/Upload skindata)
  blockchainData: { block: Number, senderPubkey: String, recipientAddress: String, mosaics: [{mosaicId: String, quantity: Number}], deadline: Date, message: {messageType: Number, data: String} },
  // Only AddSkinData, UploadSkinData, UpdateSkinData will have blockchain data and transaction hash
  addressType: { type: String, required: false, unique: false },
  userId: { type: String, required: false, unique: false },
  institutionId: { type: String, required: false, unique: false }
});

/*
GetList
CheckAddress
AddSkinData
FileUpload

searchByHash
searchByAddress
getBlockDetails
addSkinData
transactionHash
blockchainData
*/

translogSchema.statics.Create = function(transType, user, extData)
{
  var log = new TransLog();

  log.transactionType = transType;
  log.description = `${transType} by user ${user}`;

  if (extData)
  {
    if ( Array.isArray(extData) )
      log.description += ' - ' + extData.join(',');
    else
      log.description += ' - ' + extData;
  }
  log.createdAt = Date.now();
  log.creator = "BC API";

  if (transType == "CheckAddress")
    log.addressType = extData[1];
  
  return log;
};

translogSchema.methods.User = function(user)
{
  this.userId = user.id;
  this.institutionId = user.institutionId;
};


var TransLog = mongoose.model('TransLog', translogSchema, 'transLog');

module.exports = TransLog;


