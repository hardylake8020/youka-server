'use strict';

var salesman = require('../controllers/salesman'),
  userFilter = require('../filters/user');

module.exports = function (app) {
  app.route('/salesman/list/all/basic').get(userFilter.requireUser, salesman.getCompanySalesmanOnly); //只获取与公司相关的关注人username

};
