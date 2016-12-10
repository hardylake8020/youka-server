'use strict';


var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

module.exports = function (appDb) {
  var ResetTempSchema = new Schema({
    object: {
      type: String,
      default: 'resetTemp'
    },
    username:{
      type:String
    },
    create_time: {
      type: Date,
      default: Date.now,
      expires: 60
    }
  });

  appDb.model('ResetTemp', ResetTempSchema);
};