/**
 * Created by elinaguo on 15/6/2.
 */
'use strict';
var appDb = require('../../libraries/mongoose').appDb,
  ResetTemp = appDb.model('ResetTemp');

exports.getResetToken = function (username, callback) {
  ResetTemp.findOne({username: username}, function (err, resetTemp) {
    if (err) {
      return callback({err: {type: 'internal_system_error'}});
    }

    resetTemp = resetTemp ? resetTemp : new ResetTemp({username: username});

    resetTemp.save(function (err, resetTemp) {
      if (err) {
        return callback({err: {type: 'internal_system_error'}});
      }
      return callback(null, resetTemp._id);
    });
  });
};

exports.getUsernameById = function (id,callback) {
  ResetTemp.findOne({_id: id}, function (err, resetTemp) {
    if (err) {
      return callback({err: {type: 'internal_system_error'}});
    }

    if(!resetTemp){
      return callback();
    }

    return callback(null, resetTemp.username);
  });
};