/**
 * Created by wd on 0606.
 */

'use strict';

var companyError = require('../errors/company'),
  async = require('async'),
  appDb = require('../../libraries/mongoose').appDb,
  CompanyVehicle = appDb.model('CompanyVehicle'),
  mongoose = require('mongoose');

function checkVehicleExist(companyId, vehicleInfo, callback) {
  if (!companyId || !vehicleInfo || !vehicleInfo.plate_number) {
    return callback({err: companyError.invalid_params});
  }

  var condition = {
    company: companyId,
    $or: []
  };
  if (vehicleInfo.plate_number) {
    condition.$or.push({plate_number: vehicleInfo.plate_number});
  }
  if (condition.$or.length === 0) {
    return callback({err: companyError.invalid_params});
  }

  CompanyVehicle.findOne(condition, function (err, companyVehicle) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, companyVehicle);
  });
}

function getVehicleListByCondition(condition, limit, callback) {
  CompanyVehicle.find(condition)
    .limit(limit)
    .exec(function (err, vehicleList) {
      if (err) {
        err = {err: companyError.internal_system_error};
      }
      return callback(err, vehicleList);
    });
}

function findVehicleById(vehicleId, callback) {
  CompanyVehicle.findOne({_id: vehicleId}, function (err, vehicle) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, vehicle);
  });
}

exports.checkVehicleExist = function (companyId, vehicleInfo, callback) {
  return checkVehicleExist(companyId, vehicleInfo, callback);
};

exports.createVehicle = function (companyId, vehicleInfo, callback) {
  if (!companyId || !vehicleInfo || !vehicleInfo.plate_number) {
    return callback({err: companyError.invalid_params});
  }

  //检查车辆是否存在
  checkVehicleExist(companyId, vehicleInfo, function (err, companyVehicle) {
    if (err) {
      return callback(err);
    }
    if (companyVehicle) {
      return callback({err: companyError.vehicle_exist});
    }
    companyVehicle = new CompanyVehicle({
      company: companyId,
      vehicle_type : vehicleInfo.vehicle_type,
      plate_number : vehicleInfo.plate_number,
      load_cube : vehicleInfo.load_cube,
      load_weight : vehicleInfo.load_weight,
      drivers : vehicleInfo.drivers
    });
    companyVehicle.save(function (err, saveVehicle) {
      if (err || !saveVehicle) {
        err = {err: companyError.internal_system_error};
      }
      return callback(err, saveVehicle);
    });
  });
};
exports.removeVehicle = function (companyId, vehicleId, callback) {
  if (!companyId || !vehicleId) {
    return callback({err: companyError.invalid_params});
  }

  CompanyVehicle.remove({_id: vehicleId, company: companyId}, function (err, raw) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    //raw 删除的个数
    return callback(err, raw);
  });
};
exports.updateVehicle = function (companyId, vehicleInfo, callback) {
  if (!companyId || !vehicleInfo || !vehicleInfo._id || !vehicleInfo.plate_number || !vehicleInfo.drivers) {
    return callback({err: companyError.invalid_params});
  }

  findVehicleById(vehicleInfo._id, function (err, findVehicle) {
    if (err) {
      return callback(err);
    }
    if (!findVehicle) {
      return callback({err: companyError.vehicle_not_exist});
    }

    findVehicle.vehicle_type = vehicleInfo.vehicle_type || 1;
    findVehicle.plate_number = vehicleInfo.plate_number;
    findVehicle.load_cube = vehicleInfo.load_cube || 0;
    findVehicle.load_weight = vehicleInfo.load_weight || 0;
    findVehicle.drivers = vehicleInfo.drivers;

    findVehicle.save(function (err, saveVehicle) {
      if (err || !saveVehicle) {
        console.log(err);
        err = {err: companyError.internal_system_error};
      }
      return callback(err, saveVehicle);
    });
  });
};
exports.getVehicleList = function (companyId, callback) {
  if (!companyId) {
    return callback({err: companyError.invalid_params});
  }
  CompanyVehicle.find({company: companyId}, function (err, vehicleList) {
    if (err) {
      err = {err: companyError.internal_system_error};
    }
    return callback(err, vehicleList);
  });
};
exports.getContactVehicleList = function (companyId, inputVehicle, callback) {
  if (!companyId || !inputVehicle) {
    return callback({err: companyError.invalid_params});
  }

  var condition = {
    company: companyId,
    $or: [
      {
        brief: {$regex: inputVehicle, $options: 'i'}
      },
      {
        detail: {$regex: inputVehicle, $options: 'i'}
      }]
  };

  getVehicleListByCondition(condition, 10, function (err, vehicleList) {
    return callback(err, vehicleList);
  });
};


