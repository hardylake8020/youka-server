/**
 * Created by elinaguo on 15/6/5.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var TempWechatShareSchema = new Schema({
    order_ids: {
      type: [
        {type: Schema.Types.ObjectId}
      ]
    },
    orders: {
      type: [
        {type: Schema.Types.Mixed}
      ]
    }
  });

  TempWechatShareSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('TempWechatShare', TempWechatShareSchema);

};
