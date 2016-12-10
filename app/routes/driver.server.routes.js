'use strict';

/**
 * Module dependencies.
 */
var drivers = require('../../app/controllers/driver'),
  driverFilter = require('../filters/driver'),
  userFilter = require('../filters/user'),
  companyFilter = require('../filters/company');

module.exports = function (app) {
  app.route('/driver/invite1').post(userFilter.requireUser, drivers.invite1);
  app.route('/driver/invite').post(userFilter.requireUser, drivers.invite);
  app.route('/driver/signup').post(drivers.signUp);
  app.route('/driver/signin').post(drivers.signIn);
  app.route('/driver/signout').post(drivers.signOut);
  app.route('/driver/getsmsverifycode').post(drivers.getSMSVerifyCode);
  app.route('/driver/order/getbyid').get(driverFilter.requireDriver, drivers.getOrderById);
  app.route('/driver/order/getbystatus').get(driverFilter.requireDriver, drivers.getOrdersByStatuses);
  app.route('/driver/device/update').post(driverFilter.requireDriver, drivers.updateDeviceId); //更新设备Id时，filter中不需要检查device_id，wayne
  app.route('/driver/profile').post(driverFilter.requireDriver, drivers.updateProfile);
  app.route('/driver/passwordcode').post( drivers.getUpdatePasswordVerifyCode);
  app.route('/driver/password/update').post(drivers.updatePassword);
  app.route('/driver/version').get(drivers.version);
  app.route('/driver/version/ios').get(drivers.versionIos);

  app.route('/driver/evaluation/page').get(userFilter.requireUser, drivers.getEvaluationPage);
  app.route('/driver/evaluation/create').get(userFilter.requireUser, drivers.createEvaluation);
  app.route('/driver/evaluation/update').get(userFilter.requireUser, drivers.updateEvaluation);
  app.route('/driver/evaluation/count/all').get(driverFilter.requireDriver, drivers.getEvaluationAllCount);
  app.route('/driver/evaluation/list/simple').get(driverFilter.requireDriver, drivers.getEvaluationList);

};

