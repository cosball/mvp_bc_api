'use strict';

var Config = require('../config');

var Mongoose = require('mongoose');
var Institution = require('../mongo/institution_schema');

const sha256 = require('sha256');

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

const nem2_library = require("nem2-library");

var ins = new Institution({
  // The unique short name of the Vault's partner institution
  institutionShortName: 'TEST_INST_1',
  // The institution/company name
  institutionName: 'TEST INST NAME 1',
  // The institution/company address
  institutionAddress: 'Somewhere',
  // The NEM public key of the institution/company
  institutionType: 'Exchange',
  // Contact number of the institution/company
  contactNo: '0123456789',
  // Date/time this record was created
  createdAt: Date.now(),
  // Date/time this record was last updated
  updatedAt: null,
  // The user name of the one who created this record
  creator: 'admin',
  // The user name of the one who updated this record
  updatedBy: null
});

Mongoose.connect(Config.MONGODB_URI, Config.MONGODB_OPTIONS, function(err) {
    if (err) 
      return res.status(500).json({ message: err });
    
    ins.save(function(err, v) {
        if (err) throw err;
  
        console.log('Institution saved in mongoDB successfully! : ' + v.id);
        
        var sha256Hash = sha256(Config.BLACKLIST_MASTER_KEY + (v.id)).toUpperCase();
        const account = Account.createFromPrivateKey(sha256Hash, NetworkType.MIJIN_TEST);

        console.log("Institution NEM Account");
        console.log("** Address : " + account.address.pretty());
        console.log("** PrivateKey : " + nem2_library.convert.uint8ToHex(account.keyPair.privateKey));
        console.log("** PublicKey : " + nem2_library.convert.uint8ToHex(account.keyPair.publicKey));

        // const recipientAddress = Address.createFromPublicKey('BAE3F461274339FC8AD5E7A3F78803E4350C51679B4BE4DD7C0CF978CB0CD69D', NetworkType.MIJIN_TEST);
      
        // var message = "Welcome to The Vault";

        // const transferTransaction = TransferTransaction.create(
        //   Deadline.create(),
        //   recipientAddress,
        //   [new Mosaic(new MosaicId(Config.MOSAIC_ID), UInt64.fromUint(0))],
        //   PlainMessage.create(message),
        //   NetworkType.MIJIN_TEST);
      
        // // 02 result.Signing the transaction        
        // const signedTransaction = account.sign(transferTransaction);
      
        // // 03 result.Announcing the transaction
        // const transactionHttp = new TransactionHttp(Config.NEM_API_URL);
      
        // transactionHttp
        //   .announce(signedTransaction)
        //   .subscribe(x => console.log(signedTransaction.hash), err => console.error(err));

        // const accountHttp = new AccountHttp(Config.NEM_API_URL);
        // const address = Address.createFromRawAddress('SD5DT3-CH4BLA-BL5HIM-EKP2TA-PUKF4N-Y3L5HR-IR54');
          
        // accountHttp
        //   .getAccountInfo(address)
        //   .subscribe(accountInfo => console.log(accountInfo), err => console.error(err));

        // process.exit();
    });
});
