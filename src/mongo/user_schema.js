var mongoose = require('mongoose');

var sha256 = require('sha256');

var Institution = require('../mongo/institution_schema');
var ConfigLimits = require('../mongo/config_limits_schema');

/*
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect('mongodb://scanDemoUserDev:b578db6edee8dddd03fe23d91c95aeaf@3.1.49.26:27017/scanDemoDev');
*/
var Schema = mongoose.Schema;

var userSchema = new Schema({
  // Unique user name chosen during signup
  username: { type: String, required: true, unique: true },
  // First name of the user
  firstname: { type: String, required: true, unique: false },
  // Last name of the user
  lastname: { type: String, required: true, unique: false },
  // Email of the user
  email: { type: String, required: true, unique: true },
  // Password of the user
  password: { type: String, required: true, unique: false },
  // The company where the user belongs
  institutionShortName: { type: String, required: true, unique: false },
  // Role Type: 'Super', 'Admin', 'User'
  // Super means user will have access to all transactions/data
  // Admin means user will have access to all transactions/data of the users belonging to his company
  // User means user will have access to only his transactions/data
  roleType: { type: String, required: true, unique: false },  
  // Position/Title of user
  posTitle: { type: String, required: false, unique: false },
  // Contact number of the user
  contactNo: { type: String, required: false, unique: false },
  // Number of add skindata transactions done by this user
  addSkinDataCount: { type: Number, required: true, unique: false},
  // Number of uploads done by this user
  upSkinDataCount: { type: Number, required: true, unique: false},
  // Date/time when this record was created
  createdAt: { type: Date, required: true, unique: false },
  // Date/time when this record was last updated
  updatedAt: { type: Date, required: false, unique: false },
  // The user name who created this record
  creator: { type: String, required: true, unique: false },
  // The user name who updated this record
  updatedBy: { type: String, required: false, unique: false },
  // Date/time the user last logged in
  lastSignin: { type: Date, required: false, unique: false },
  // Date/Time the user's current sign in time
  currentSignIn: { type: Date, required: false, unique: false },
  // Indicates if this is the user's first sign in
  firstSignIn: { type: Boolean, required: true, unique: false },  
  // Email verified field to if email was verified
  emailVerified: { type: Boolean, required: true, unique: false },
  institutionId: { type: String, required: true, unique: false }
});


userSchema.statics.IsValidUser = function(username, password, cb_valid, cb_invalid) {
  // console.log("userSchema.IsValidUser() " + requester + ":" + userid_pass + ":" + sha256(userid_pass));

  this.findOne({user_name:username, password:sha256(password)}, function (err, user) {
    if (err) return handleError(err);
    if (user) {
      ConfigLimits.GetConfigLimit(user.user_name, 
        function(config_limit) {
          cb_valid(user, config_limit);
        }, 
        function(){ 
          cb_invalid();
        }
      );
    }
    else {
      cb_invalid();
    }
  });
};

var User = mongoose.model('User', userSchema, 'user');

module.exports = User;
 