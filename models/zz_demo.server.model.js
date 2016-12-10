/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {

  var DemoDriversSchema = new Schema({
    drivers: {
      type: [Schema.Types.ObjectId]
    }
  });
  appDb.model('DemoDrivers', DemoDriversSchema);

  var DemoTracesSchema = new Schema({
    driver: {
      type: Schema.Types.ObjectId
    },
    location: {
      type: [Number]//[longitude,latitude]
    },
    type: {
      type:String,
      default:'gps'
    },
    time: {
      type: Date
    }
  });
  appDb.model('DemoTraces', DemoTracesSchema);

};
