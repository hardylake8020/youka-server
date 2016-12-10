/**
 * Created by Wayne on 15/7/10.
 */

'use strict';

var userProfile = require('../controllers/user_profile'),
  userFilter = require('../filters/user');

module.exports = function (app) {
  app.route('/userprofile').get(userFilter.requireUser, userProfile.getUserProfile);
  app.route('/customizecolumnsfollow').post(userFilter.requireUser, userProfile.setFollowCustomizeColumns);
  app.route('/customizecolumnsassign').post(userFilter.requireUser, userProfile.setAssignCustomizeColumns);
  app.route('/userprofile/max_page_count').get(userFilter.requireUser, userProfile.setMaxPageCount);

};
