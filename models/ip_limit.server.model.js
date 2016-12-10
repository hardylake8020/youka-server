'use strict';


var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

module.exports = function (appDb) {
  var IpLimitSchema = new Schema({
    object: {
      type: String,
      default: 'ipLimit'
    },
    create_time: {
      type: Date,
      default: Date.now,
      expires: 30
    },
    ip_path: {
      type: String
    }
  });


  appDb.model('IpLimit', IpLimitSchema);
};