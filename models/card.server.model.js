'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var CardSchema = new Schema({
    object: {
      type: String,
      default: 'card'
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      require: true
    },
    truck: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    truck_number: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['unEtc', 'etc'],
      default: 'unEtc'
    },
    number: {
      type: String,
      require: true
    }
  });

  CardSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  appDb.model('Card', CardSchema);

  var TruckSchema = new Schema({
    object: {
      type: String,
      default: 'truck'
    },
    //车牌号
    truck_number: {
      type: String
    },
    truck_type: {
      type: String
    },
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card'
    },
    card_number: {
      type: String
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    driver_number: {
      type: String,
      default: ''
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    status: {
      type: String,
      enum: ['usage', 'unUsage'],
      default: 'unUsage'
    },
    location: {
      type: [Number]
    }
  });

  TruckSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  appDb.model('Truck', TruckSchema);
};
