
'use strict';

var cryptoLib = require('../libraries/crypto'),
  cookieLib = require('../libraries/cookie'),
  appDb = require('../../libraries/mongoose').appDb,
  CustomizeEvent = appDb.model('CustomizeEvent'),
  Driver = appDb.model('Driver');

var driverError = require('../errors/driver'),
  customizeEventError = require('../errors/customize_event');

exports.requireDriver = function (req, res, next) {
  var token;
  var phone_id = req.body.phone_id || req.query.phone_id || '';

  if (req.body.access_token) {
    token = req.body.access_token;
  } else {
    token = req.query.access_token;
  }

  req.connection = req.connection ? req.connection : {};
  req.socket = req.socket ? req.socket : {};
  req.connection.socket = req.connection.socket ? req.connection.socket : {};

  if (!token) {
    return res.send({
      err: {
        type: 'undefined_access_token',
        message: 'a access_token to be need',
        param: 'access_token'
      }
    });
  }

  try {
    token = cryptoLib.decrpToken(token, 'secret');
  }
  catch (e) {
    return res.send({
      err: {
        type: 'invalid_access_token',
        message: 'invalid access token',
        param: 'invalid_access_token'
      }
    });
  }

  Driver.findOne({_id: token._id}, function (err, driver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!driver) {
      return res.send({err: driverError.account_not_exist});
    }
    //如果上传了device_id，则检查当前是否已更换了设备
    if (phone_id) {
      //当前帐号已被其他设备登录，则要求自己重新登录
      if (driver.phone_id && driver.phone_id !== phone_id) {
        return res.send({err: driverError.account_disconnected});
      }
    }

    req.driver = driver;
    next();

  });
};

exports.requireTemporaryDriver = function (req, res, next) {
  var customizeEventId = req.body.customize_event_id || req.query.customize_event_id || '';
  if (!customizeEventId) {
    return res.send({err: customizeEventError.customize_event_id_empty});
  }

  CustomizeEvent.findOne({_id: customizeEventId, delete_status: false}).exec(function (err, findEvent) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }
    if (!findEvent) {
      return res.send({err: customizeEventError.customize_event_id_invalid});
    }

    if (findEvent.content.event_type !== 'assign_driver') {
      return res.send({err: customizeEventError.event_type_invalid});
    }

    if (!findEvent.content.driver || !findEvent.content.order) {
      return res.send({err: customizeEventError.assign_driver_content_empty});
    }

    Driver.findOne({_id: findEvent.content.driver}, function (err, currentDriver) {
      if (err || !currentDriver) {
        return res.send({err: driverError.internal_system_error});
      }
      else {
        req.driver = currentDriver;
        req.order_id = findEvent.content.order;

        next();
      }
    });

  });
};

exports.requireDriverWithoutCheckDeviceId = function (req, res, next) {
  var token;

  if (req.body.access_token) {
    token = req.body.access_token;
  } else {
    token = req.query.access_token;
  }

  req.connection = req.connection ? req.connection : {};
  req.socket = req.socket ? req.socket : {};
  req.connection.socket = req.connection.socket ? req.connection.socket : {};

  if (!token) {
    return res.send({
      err: {
        type: 'undefined_access_token',
        message: 'a access_token to be need',
        param: 'access_token'
      }
    });
  }

  try {
    token = cryptoLib.decrpToken(token, 'secret');
  }
  catch (e) {
    return res.send({
      err: {
        type: 'invalid_access_token',
        message: 'invalid access token',
        param: 'invalid_access_token'
      }
    });
  }

  Driver.findOne({_id: token._id}, function (err, driver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!driver) {
      return res.send({err: driverError.account_not_exist});
    }

    req.driver = driver;
    next();
  });
};

//不检查相同账号多个设备登录，只检查账号是否存在
exports.requireDriverWithId = function (req, res, next) {
  var driverId = req.body.driver_id || req.query.driver_id || '';

  if (!driverId) {
    return res.send({err: driverError.driver_id_or_name_null});
  }

  Driver.findOne({_id: driverId}, function (err, driver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!driver) {
      return res.send({err: driverError.account_not_exist});
    }

    req.driver = driver;
    next();
  });
};

exports.requireDriverWithOpenid = function (req, res, next) {
  var openid = req.body.openid || req.query.openid || '';
  var cookie = cookieLib.getCookie(req);
  cookie.openid = cookie.driver_openid || '';

  if (!openid) {
    if (cookie.openid && cookie.openid !== 'undefined') {
      openid = cookie.openid;
    }
  }

  if (!openid) {
    return res.send({err: {type: 'openid_empty'}});
  }

  Driver.findOne({'wechat_profile.openid': openid}).exec( function (err, driver) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }

    if (!driver) {
      return res.send({err: {type: 'invalid_openid'}});
    }

    req.driver = driver;
    next();
  });
};