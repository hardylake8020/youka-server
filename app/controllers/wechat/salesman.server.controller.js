'use strict';

var path = require('path'),
  config = require('../../../config/config'),
  async = require('async'),
  superagent = require('superagent').agent(),
  appDb = require('../../../libraries/mongoose').appDb,
  cookieLib = require('../../libraries/cookie'),
  jsxlsxUtil = require('../../../libraries/jsxlsx_util'),
  smsLib = require('../../libraries/sms'),
  Order = appDb.model('Order'),
  SmsVerify = appDb.model('SmsVerify');

var salesmanError = require('../../errors/wechat/salesman'),
  salesmanService = require('../../services/wechat/salesman'),
  wechatService = require('../../services/wechat/wechat'),
  salesmanCompanyService = require('../../services/wechat/salesman_company'),
  traceService = require('../../services/trace'),
  orderService = require('../../services/order'),
  driverEvaluationService = require('../../services/driver_evaluation');
var access_token = '';


function getOrderTraces(orderId, callback) {
  orderService.getDriverChildrenOrders(orderId, function (err, driverOrders) {
    if (err) {
      return callback(err);
    }
    traceService.getTracesByOrders(driverOrders)
      .then(function (result) {
        return callback(null, result);
      }, function (err) {
        return callback(err);
      });
  });

}
function orderDetailPage(res, order) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/order_detail_page.client.view.html'), {
    order: JSON.stringify(order)
  });
}
function orderSearchPage(res, openid) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/order_search.client.view.html'), {openid: openid});
}
function orderListPage(res, salesman) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/order.client.view.html'), {salesman: salesman});
}
function salesmanBindPage(res, openid, accessToken) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/bind.client.view.html'), {
    openid: openid,
    access_token: accessToken
  });
}

function salesmanErrorPage(res, errType) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/error.client.view.html'), {errType: errType});
}
function salesmanHomePage(res, salesman) {
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/home.client.view.html'), {salesman: salesman});
}

exports.orderDetailPage = function (req, res, next) {
  var currentOrder = req.currentOrder;
  return orderDetailPage(res, currentOrder);
};
exports.orderMapPage = function (req, res, next) {
  var currentOrder = req.currentOrder;
  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/order_map_page.client.view.html'), {order: JSON.stringify(currentOrder)});
};
exports.orderDeliveryConfirmPage = function (req, res, next) {
  var currentOrder = req.currentOrder;
  if (currentOrder.status !== 'unDeliverySigned' && currentOrder.status !== 'unDeliveried') {
    return res.send({err: salesmanError.order_status_invalid});
  }
  if (!currentOrder.actual_delivery_goods || currentOrder.actual_delivery_goods.length === 0) {
    return res.send({err: salesmanError.actual_delivery_goods_empty});
  }

  return res.render(path.join(__dirname, '../../../web/wechat/salesman/views/order_delivery_confirm_page.client.view.html'), {order: JSON.stringify(currentOrder)});
};
exports.driverTraces = function (req, res, next) {
  var curentOrder = req.currentOrder;
  getOrderTraces(curentOrder._id, function (err, driverTraces) {
    if (err) {
      return res.send(err);
    }
    return res.send(driverTraces);
  });
};
exports.orderSearchPage = function (req, res, next) {
  var openid = req.query.openid || req.body.openid || '';
  return orderSearchPage(res, openid);
};
exports.orderListPage = function (req, res, next) {
  var openid = req.query.openid || req.body.openid || '';
  return orderListPage(res, openid);
};
exports.homePage = function (req, res, next) {
  return salesmanHomePage(res, {});
};
exports.bindPage = function (req, res, next) {
  return salesmanBindPage(res, '', '');
};
exports.getVerifyCode = function (req, res, next) {
  var phone = req.body.phone || '';
  console.log(req.body);

  wechatService.createVerifyCode(phone, function (err, verify) {
    if (err) {
      return res.send(err);
    }
    return res.send({_id: verify._id});
  });
};
exports.getReceiverNames = function (req, res, next) {
  var salesman = req.salesman || {};
  Order.aggregate([
    {
      $match: {
        $or: [
          {'salesmen.username': salesman.username},
          {'delivery_contacts.mobile_phone': salesman.username},
          {'pickup_contacts.mobile_phone': salesman.username}
        ]
      }
    },
    {
      $group: {
        _id: '$receiver_name'
      }
    }, {
      $project: {
        name: '$_id'
      }
    }
  ]).exec(function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.entrance = function (req, res, next) {
  if (process.env.NODE_ENV === 'development') {

    salesmanService.findSalesmanByUsername('13918429709', function (err, salesman) {
      return salesmanHomePage(res, salesman);
    });
    //return salesmanHomePage(res, {wechat_profile: {}});
  }
  else {
    var cookie = cookieLib.getCookie(req);
    var cookieOpenid = cookie.salesman_openid || '';

    if (!cookieOpenid && !req.query.code) {
      return salesmanErrorPage(res, 'can not get openid');
    }

    async.auto({
        getOpenid: function (callback) {
          if (cookieOpenid !== 'undefined' && cookieOpenid) {
            return callback(null, {openid: cookieOpenid, access_token: null});
          }
          wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
            return callback(null, {openid: tokenInfo.openid, access_token: tokenInfo.access_token});
          });
        },
        getSalesman: ['getOpenid', function (callback, result) {
          var openid = result.getOpenid.openid;
          if (!openid || openid === 'undefined') {
            return callback({err: {type: 'invalid_openid'}});
          }
          salesmanService.getByOpenid(openid, function (err, salesman) {
            return callback(err, salesman);
          });
        }]
      },
      function (err, result) {
        if (err) {
          return salesmanErrorPage(res, err.err.type);
        }

        var salesman = result.getSalesman;
        var openid = result.getOpenid.openid;
        var accessToken = result.getOpenid.access_token;

        if (!salesman || !salesman.wechat_profile.openid) {
          res = cookieLib.setCookie(res, 'salesman_openid', '');

          if (!accessToken) {
            wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
              return salesmanBindPage(res, tokenInfo.openid, tokenInfo.access_token);
            });
          }
          else {
            return salesmanBindPage(res, openid, accessToken);
          }
        }
        else {
          res = cookieLib.setCookie(res, 'salesman_openid', openid);
          return salesmanHomePage(res, salesman);
        }
      });
  }
};
exports.getSalesmanOrderList = function (req, res, next) {
  var salesman = req.salesman || {};
  var statuses = JSON.parse(req.body.statuses) || '';
  var limit = parseInt(req.body.limit) || 10;
  var skip = parseInt(req.body.skip) || 0;
  var type = req.body.type || '';
  var abnormalTypes = JSON.parse(req.body.abnormal_types || '[]');
  var startTime = req.body.start_time || '';
  var endTime = req.body.end_time || '';

  console.log(startTime);
  console.log(endTime);
  var condition = {
    $and: [{
      type: 'company',
      parent_order: {$exists: false}
    }]
  };

  switch (type) {
    case 'abnormal':
      condition.$and.push({
        $or: [
          {'salesmen.username': salesman.username},
          {'delivery_contacts.mobile_phone': salesman.username},
          {'pickup_contacts.mobile_phone': salesman.username}
        ]
      });
      condition.$and.push({
        $or: [
          {
            pickup_deferred: true
          },
          {
            delivery_deferred: true
          },
          {
            damaged: true
          },
          {
            missing_packages: true
          },
          {
            pickup_missing_packages: true
          },
          {
            delivery_missing_packages: true
          },
          {
            pickup_address_difference: true
          },
          {
            delivery_address_difference: true
          },
          {
            'halfway_events': {$gt: {$size: 0}}
          }
        ]
      });
      break;
    case 'receiver':
      condition.$and.push({'delivery_contacts.mobile_phone': salesman.username});
      break;
    case 'sender':
      condition.$and.push({'pickup_contacts.mobile_phone': salesman.username});
      break;
    case 'salesman':
      condition.$and.push({'salesmen.username': salesman.username});
      break;
    default:
      condition.$and.push({
        $or: [
          {'salesmen.username': salesman.username},
          {'delivery_contacts.mobile_phone': salesman.username},
          {'pickup_contacts.mobile_phone': salesman.username}
        ]
      });
  }
  if (abnormalTypes.length > 0) {
    var abnormalArray = ['pickup_deferred', 'delivery_deferred', 'damaged', 'missing_packages'];
    var cond = {$or: []};
    abnormalTypes.forEach(function (type) {
      if (abnormalArray.indexOf(type) >= 0) {
        var item = {};
        item[type] = true;
        cond.$or.push(item);
      }
    });
    if (cond.$or.length > 0) {
      condition.$and.push(cond);
    }
  }

  if (statuses) {
    condition.$and.push({status: {$in: statuses}});
  }

  if (startTime && endTime) {
    condition.$and.push({
      created: {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      }
    });
  }

  if (startTime && !endTime) {
    condition.$and.push({created: {$gte: new Date(startTime)}});
  }

  if (!startTime && endTime) {
    condition.$and.push({created: {$lte: new Date(endTime)}});
  }
  console.log(JSON.stringify(condition));

  Order.find(condition).sort({created: -1}).skip(skip).limit(limit).exec(function (err, orders) {
    if (err || !orders) {
      console.log(JSON.stringify(err));
      console.log(err);
      return res.send({err: {type: 'internal_system_error'}});
    }
    return res.send(orders);
  });
};
exports.bindWx = function (req, res, next) {
  var phone = req.body.phone || '';
  var openid = req.body.openid || '';
  var accessToken = req.body.access_token || '';
  var codeid = req.body.codeid || '';
  var code = req.body.code || '';

  wechatService.getVerifyCode(codeid, code, function (err, verify) {
    if (err) {
      return res.send(err);
    }

    wechatService.getUserInfo(accessToken, openid, function (err, userInfo) {
      if (err) {
        return res.send(err);
      }

      if (userInfo && !userInfo.openid) {
        console.log('get user info failed:');
        console.log(userInfo);
        return res.send({err: {type: 'get_wechat_info_failed'}});
      }

      salesmanService.bindWx(phone, openid, userInfo, function (err, result) {
        if (err) {
          return res.send(err);
        }
        res = cookieLib.setCookie(res, 'salesman_openid', openid);
        return res.send(result);
      });
    });
  });
};
exports.unbindWx = function (req, res, next) {
  var salesman = req.salesman || {};

  wechatService.unbindObject(salesman, function (err, result) {
    res = cookieLib.setCookie(res, 'salesman_openid', '');
    return res.send(err || {success: true});
  });
};
exports.create = function (req, res, next) {
  var curUser = req.user || {};
  var company = curUser.company || {};
  var userInfo = req.body.user_info || {};

  if (!userInfo.username) {
    return res.send({err: salesmanError.salesman_username_is_empty});
  }
  if(!userInfo.nickname){
    return res.send({err: salesmanError.salesman_nickname_is_empty});
  }
  userInfo.email = userInfo.email || '';
  userInfo.nickname = userInfo.nickname || '';

  salesmanService.create(company._id, userInfo, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.batchCreate = function (req, res, next) {
  var curUser = req.user || {};
  var company = curUser.company || {};
  var userInfos = req.body.user_infos || {};

  salesmanService.bathCreate(company._id, userInfos, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.removeSalesmanCompanyById = function (req, res, next) {
  var curUser = req.user || {};
  var company = curUser.company || {};
  var salesmanCompanyId = req.query.salesman_company_id || '';

  if (!salesmanCompanyId) {
    return res.send({err: salesmanError.salesman_company_id_is_empty});
  }
  salesmanCompanyService.removeSalesmanCompanyById(company._id, salesmanCompanyId, function (err) {
    if (err) {
      return res.send(err);
    }
    return res.send({success: true});
  });
};
exports.removeSalesmanCompanyByUsername = function (req, res, next) {
  var curUser = req.user || {};
  var company = curUser.company || {};
  var username = req.query.username || '';

  if (!username) {
    return res.send({err: salesmanError.salesman_username_is_empty});
  }

  salesmanCompanyService.removeSalesmanCompanyByUsername(company._id, username, function (err) {
    if (err) {
      return res.send(err);
    }
    return res.send({success: true});
  });
};
exports.update = function (req, res, next) {
  var curUser = req.user || {};
  var company = curUser.company || {};
  var userInfo = req.body.user_info;

  if (!userInfo.username) {
    return res.send({err: salesmanError.salesman_username_is_empty});
  }
  salesmanService.update(company._id, userInfo, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.getListByCompanyIdWithDetail = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  salesmanCompanyService.getListByCompanyIdWithDetail(company._id, function (err, salesmans) {
    if (err) {
      return res.send(err);
    }
    return res.send(salesmans);
  });
};
Date.prototype.Format = function (fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};
exports.exportListByCompanyIdWithDetail = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  salesmanCompanyService.getListByCompanyIdWithDetail(company._id, function (err, salesmans) {
    if (err) {
      return res.send(err);
    }
    // 返回excel文件
    var rows = [['手机号', '姓名', '邮箱', '绑定时间']];
    for (var i = 0, len = salesmans.length; i < len; i++) {
      var row = [];
      var sale = salesmans[i];
      row.push("'" + sale.username);
      row.push(sale.nickname || '--');
      row.push(sale.email || '--');
      row.push(sale.salesman && sale.salesman.wechat_profile && (new Date(sale.salesman.last_active_time).Format('yyyy.MM.dd')) || '未绑定微信');
      rows.push(row);
    }
    var wb = jsxlsxUtil.Workbook();
    var ws = jsxlsxUtil.sheet_from_array_of_arrays(rows);
    var ws_name = '关注人列表';
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;
    var data = jsxlsxUtil.write(wb, {type: 'buffer'});
    res.setHeader('Content-disposition', 'attachment; filename=salesmen.xlsx');
    return res.send(new Buffer(data));
  });
};
exports.getCompanySalesmanOnly = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  salesmanCompanyService.getCompanySalesmanOnly(company._id, function (err, salesmans) {
    if (err) {
      return res.send(err);
    }
    return res.send(salesmans);
  });
};

exports.redirectToTenderServer = function (req, res, next) {
  res.redirect('http://tender.zhuzhu56.com/wechat/entrance?code=' + req.query.code);
};


exports.evaluationOrder = function (req, res, next) {
  var salesman = req.salesman;
  var currentOrder = req.currentOrder;
  var level = parseInt(req.body.level) || 0;
  if (level < 1 || level > 3) {
    level = 1;
  }
  var content = req.body.text || '';

  if (currentOrder.status !== 'completed') {
    return res.send({err: salesmanError.order_status_invalid});
  }

  if (currentOrder.evaluation_users && currentOrder.evaluation_users.indexOf(salesman.username) > -1) {
    return res.send({err: salesmanError.order_has_evaluation});
  }


  driverEvaluationService.createForSalesman(currentOrder, salesman, level, content, function (err, evaluation) {
    if (err) {
      return res.send(err);
    }

    if (!currentOrder.evaluation_users) {
      currentOrder.evaluation_users = [];
    }
    currentOrder.evaluation_users.push(salesman.username);
    currentOrder.markModified('evaluation_users');
    currentOrder.save(function (err, saveCurrentOrder) {
      if (err) {
        return res.send({err: salesmanError.internal_system_error});
      }
      return res.send({order: saveCurrentOrder});
    });

  });

};