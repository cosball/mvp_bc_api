'use strict';

exports.Result = class {
    constructor() {
      this.block = '';
      this.difficulty = '';
      this.timestamp = '';
      this.block_hash = '';
      this.harvester = '';
      this.num_trans = '';
      this.state_data = '';
      this.state_hash = '';
      this.sub_cache_mroots = '';
      this.transactions = '';
    };
  }

exports.Transaction = class {
    constructor() {
      this.signer = '';
      this.height = '';
      this.deadline = '';
    };
  }
