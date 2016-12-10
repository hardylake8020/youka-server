/**
 * Created by elinaguo on 15/3/26.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var CustomerContactSchema = new Schema({
    object:{
      type:String,
      default:'customercontact'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    customer_name: {
      type: String,
      required: true
    }
  });

  CustomerContactSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CustomerContact', CustomerContactSchema);
};
