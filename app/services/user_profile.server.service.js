/**
 * Created by Wayne on 15/7/10.
 */

'use strict';

var async = require('async'),
  userProfileError = require('../errors/user_profile'),
  appDb = require('../../libraries/mongoose').appDb,
  UserProfile = appDb.model('UserProfile');


function getUserProfile(userId, callback) {
  if (!userId) {
    return callback(userProfileError.params_null);
  }

  UserProfile.findOne({user_id: userId}, function (err, findEntity) {
    if (err) {
      return callback(userProfileError.internal_system_error);
    }
    if (!findEntity) {
      return callback(null, null);
    }
    return callback(null, findEntity);

  });
}

exports.getUserProfile = function (userId, callback) {
  return getUserProfile(userId, callback);
};

exports.setFollowCustomizeColumns = function (userId, customizeColumns, callback) {
  if (!userId || !customizeColumns || customizeColumns.length <= 0) {
    return callback(userProfileError.params_null);
  }

  UserProfile.findOne({user_id: userId}, function (err, findEntity) {
    if (err) {
      return callback(userProfileError.internal_system_error);
    }

    if (!findEntity) {
      findEntity = new UserProfile({
        user_id: userId
      });
    }

    findEntity.customize_columns_follow = customizeColumns;

    findEntity.save(function (err, saveEntity) {
      if (err || !saveEntity) {
        console.log(err);
        return callback(userProfileError.internal_system_error);
      }

      return callback(null, saveEntity);
    });
  });
};

exports.setAssignCustomizeColumns = function (userId, customizeColumns, callback) {
  if (!userId || !customizeColumns || customizeColumns.length <= 0) {
    return callback(userProfileError.params_null);
  }

  UserProfile.findOne({user_id: userId}, function (err, findEntity) {
    if (err) {
      return callback(userProfileError.internal_system_error);
    }

    if (!findEntity) {
      findEntity = new UserProfile({
        user_id: userId
      });
    }

    findEntity.customize_columns_assign = customizeColumns;

    findEntity.save(function (err, saveEntity) {
      if (err || !saveEntity) {
        console.log(err);
        return callback(userProfileError.internal_system_error);
      }

      return callback(null, saveEntity);
    });
  });
};


function setMaxPageCount(userId, columnName, pageCount, callback) {
  if (!userId || !columnName || !pageCount) {
    return callback(userProfileError.params_null);
  }

  UserProfile.findOne({user_id: userId}, function (err, findEntity) {
    if (err) {
      return callback(userProfileError.internal_system_error);
    }

    if (!findEntity) {
      findEntity = new UserProfile({
        user_id: userId
      });
    }

    findEntity[columnName] = pageCount;

    findEntity.save(function (err, saveEntity) {
      if (err || !saveEntity) {
        console.log(err);
        return callback(userProfileError.internal_system_error);
      }

      return callback(null, saveEntity);
    });
  });
}

exports.setAssignPageMaxCount = function (userId, pageCount, callback) {
  return setMaxPageCount(userId, 'max_page_count_assign', pageCount, callback);
};
exports.setFollowPageMaxCount = function (userId, pageCount, callback) {
  return setMaxPageCount(userId, 'max_page_count_follow', pageCount, callback);
};

exports.setOrderConfiguration = function (userId, config, callback) {

  getUserProfile(userId, function (err, profile) {
    if (err) {
      return callback({err: err});
    }

    if (!profile) {
      profile = new UserProfile({
        user_id: userId
      });
    }

    profile.pickup_entrance_force = config.pickupEntrance;
    profile.pickup_photo_force = config.pickupPhoto;
    profile.delivery_entrance_force = config.deliveryEntrance;
    profile.delivery_photo_force = config.deliveryPhoto;

    profile.save(function (err, saveProfile) {
      if (err) {
        return callback({err: userProfileError.internal_system_error});
      }
      return callback(null, saveProfile);
    });
  });

};