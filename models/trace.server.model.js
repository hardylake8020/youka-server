'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var TraceSchema = new Schema({
    object:{
      type:String,
      default:'trace'
    },
    driver:{
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    location: {
      type: [Number]//[longitude,latitude]
    },
    address: {
      type: String
    },
    time: {
      type: Date,
      default: Date.now
    },
    type:{
      type:String,
      default:'gps'
    },
    create_at:{
      type:Date,
      default:new Date()
    }
  });

  TraceSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('Trace', TraceSchema);

};
