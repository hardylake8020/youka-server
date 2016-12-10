/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

/**
 * Module dependencies.
 */
var groups = require('../controllers/group'),
  companyFilter = require('../filters/company'),
  userFilter = require('../filters/user'),
  groupFilter = require('../filters/group');

module.exports = function (app) {
  app.route('/group').post(userFilter.requireUser, companyFilter.requireCompany, groups.create);
  app.route('/group').get(userFilter.requireUser, groups.getUserViewGroups);
  app.route('/group/execute').get(userFilter.requireUser, groups.getUserExecuteGroups);
  app.route('/group/employees').get(userFilter.requireUser,groupFilter.requireGroup,groups.userListByGroup);
  app.route('/group/invite/multiemployee').post(userFilter.requireUser,companyFilter.requireCompany,groupFilter.requireGroup,groups.inviteMultiUserToGroup);
  app.route('/group/invite/employee').post(userFilter.requireUser,companyFilter.requireCompany,groupFilter.requireGroup,groups.inviteUserToGroup);
  app.route('/group/delete/user_group').post(userFilter.requireCompanyAdmin, groupFilter.requireGroup, groups.removeUserGroup);
  app.route('/group/delete/group_user').post(userFilter.requireCompanyAdmin, groupFilter.requireGroup, groups.removeGroupUser);
};
