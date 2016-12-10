'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var CompanyVehicleSchema = new Schema({
    object:{
      type:String,
      default:'companyVehicle'
    },
    company:{
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    //数字型(自有-1、挂靠-2、租赁-3、外协-4)
    vehicle_type: {
      type: Number,
      default: 1
    },
    plate_number: {
      type: String
    },
    load_cube: {
      type: Number,
      default: 0
    },
    load_weight: {
      type: Number,
      default: 0
    },
    drivers: {
      type: Schema.Types.Mixed,
      default: {}
    }
  });

  CompanyVehicleSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CompanyVehicle', CompanyVehicleSchema);

};
