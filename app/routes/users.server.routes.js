'use strict';

/**
 * Module dependencies.
 */
var users = require('../../app/controllers/user'),
  userFilter = require('../filters/user'),
  companyFilter = require('../filters/company');

module.exports = function (app) {
  app.route('/user/me').post(userFilter.requireUser, users.me);
  app.route('/user/activate/:user_id').get(users.activate);
  app.route('/user/employee/activate').post(users.employeeActivate);
  app.route('/user/profile').post(userFilter.requireUser,users.profile);
  app.route('/user/signup').post(users.signUp);
  app.route('/user/signin').post(users.signIn);
  app.route('/user/signout').post(users.signOut);
  app.route('/user/activate').post(users.sendActivateEmail);
  app.route('/user/resetpasswordrequest').get(users.sendResetPasswordEmail);
  app.route('/user/updatepassword').post(users.updatePassword);

  app.route('/user/employee_active_page').get(users.getEmployeeActivePage);

  app.param('user_id', users.findById);
  app.param('username', users.findByUsername);


};
