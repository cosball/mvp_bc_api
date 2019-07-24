'use strict';

module.exports = class CheckAddressResult {
    constructor() {
      this.block = '';
      this.transaction_hash = '';
      this.sender_pubkey = '';
      this.recipient_addr = '';
      this.mosaics = '';
      this.deadline = '';
      this.message = '';
    };
  }