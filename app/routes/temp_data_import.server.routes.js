'use strict';

/**
* Module dependencies.
*/
var temp = require('../../app/controllers/temp_data_import');
var userFilter = require('../filters/user');

module.exports = function (app) {
  //app.route('/tempdata').get(temp.importUserRelation);
  //app.route('/tempdata').get(temp.insertOrderContacts);
  app.route('/tempdata').get(userFilter.requireUser, temp.addNews);

};
