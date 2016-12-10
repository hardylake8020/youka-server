/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';
var async = require('async'),
  path = require('path'),
  fs = require('fs'),
  ejs = require('ejs'),
  config = require('../../config/config'),
  companyError = require('../errors/company'),
  userError = require('../errors/user'),
  emailLib = require('../libraries/email'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  CompanyPartner = appDb.model('CompanyPartner'),
  DriverCompany = appDb.model('DriverCompany'),
  InviteCompany = appDb.model('InviteCompany'),
  Contact = appDb.model('Contact'),
  InviteDriver = appDb.model('InviteDriver'),
  companyService = require('../services/company'),
  companyVehicleService = require('../services/company_vehicle'),
  driverService = require('../services/driver'),
  driverEvaluationService = require('../services/driver_evaluation'),
  userProfileService = require('../services/user_profile'),
  userService = require('../services/user'),
  jsxlsxUtil = require('../../libraries/jsxlsx_util');


var resultInfoEnum =
{
  signup_email_sent: {
    type: 'signup_email_sent',
    message: 'The invited user has not signed up, and we have sent the signing up link to his email box'
  },
  user_activate_email_sent: {
    type: 'user_activate_email_sent',
    message: 'The user has not activated the account, and we have sent the activating_account link to his email box'
  },
  company_not_completed: {
    type: 'company_not_completed',
    message: 'the user has not completed the company.'
  }
};

function judgeCooperateCompanyExist(selfCompanyId, partnerCompanyId, callback) {
  CompanyPartner.findOne({
      $or: [{company: selfCompanyId, partner: partnerCompanyId},
        {company: partnerCompanyId, partner: selfCompanyId}]
    },
    function (err, companyPartner) {
      if (err) {
        return callback(companyError.internal_system_error);
      }

      if (companyPartner) {
        return callback(companyError.has_been_partner);
      }

      return callback(null);
    });
}
function addNewCompany(selfCompanyId, partnerCompanyId, callback) {
  var newCompanyPartner = new CompanyPartner({
    company: selfCompanyId,
    partner: partnerCompanyId
  });
  newCompanyPartner.save(function (err, companyPartnerEntity) {
    if (err || !companyPartnerEntity) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, companyPartnerEntity);
  });
}
function verifyEmail(emailAddress, renderData, callback) {
  var templateFileName = path.join(__dirname, '../../web/zzqs2/templates/email_sent/email_verify.client.view.html');

  fs.readFile(templateFileName, 'utf8', function (err, str) {
    if (err) {
      console.log('fs.readFile(' + templateFileName + ') failed');
      return callback(companyError.internal_system_error);
    }

    var html = ejs.render(str, renderData);

    emailLib.sendEmail(emailAddress, '柱柱签收网邮箱', html,
      function (err, result) {
        if (err) {
          console.log('emailLib.sendEmail(' + emailAddress + ') failed');
          return callback(companyError.email_sent_failed);
        }

        return callback(null, result);
      });
  });
}

//通过用户邮箱来邀请合作公司
exports.inviteByUsername = function (req, res, next) {
  var currentUser = req.user || {};
  var inputUsername = req.body.username || '';

  var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!emailReg.test(inputUsername)) {
    req.err = {err: userError.invalid_email};
    return next();
  }

  if (currentUser.username === inputUsername) {
    req.err = {err: companyError.company_invite_itself};
    return next();
  }

  User.findOne({username: inputUsername}, function (err, userEntity) {
    if (err) {
      req.err = {err: companyError.internal_system_error};
      return next();
    }
    var renderData = {
      logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
      username: '客户',
      urlAddress: '',
      action: '',
      description: '',
      websiteUrl: config.serverAddress
    };

    //用户已存在
    if (userEntity) {
      //用户公司存在
      if (userEntity.company) {
        //是否是自己公司的同事
        if (userEntity.company.toString() === currentUser.company._id.toString()) {
          req.err = {err: companyError.company_invite_itself};
          return next();
        }

        //是否已经为合作公司
        judgeCooperateCompanyExist(currentUser.company._id, userEntity.company, function (err) {
          if (err) {
            req.err = {err: err};
            return next();
          }
          //添加为合作公司
          addNewCompany(currentUser.company._id, userEntity.company, function (err, companyPartner) {
            if (err) {
              req.err = {err: err};
              return next();
            }

            req.data = companyPartner;
            return next();
          });
        });
      }
      else {
        InviteCompany.findOne({
          username: inputUsername,
          company: currentUser.company._id
        }, function (err, inviteCompany) {
          if (err) {
            req.err = {err: companyError.internal_system_error};
            return next();
          }
          //如果没有邀请，则邀请该用户
          if (!inviteCompany) {
            var newInviteCompany = new InviteCompany({
              username: inputUsername,
              company: currentUser.company._id
            });
            newInviteCompany.save(function (err, newInviteCompanyEntity) {
              if (err || !newInviteCompanyEntity) {
                req.err = {err: companyError.internal_system_error};
                return next();
              }
              //如果用户没有激活，则发送激活邮件
              if (!userEntity.email_verified) {
                renderData.urlAddress = config.serverAddress + 'user/activate/' + userEntity._id;
                renderData.action = '立即激活';
                renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，激活您的账户。';

                verifyEmail(inputUsername, renderData, function (err, result) {
                });
                req.data = resultInfoEnum.user_activate_email_sent;
                return next();
              }
              else {
                //如果用户没有填写公司信息，则发送登录邮件
                renderData.urlAddress = config.serverAddress + 'zzqs2/index';
                renderData.action = '立即登录';
                renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，登录您的账户。';

                verifyEmail(inputUsername, renderData, function (err, result) {
                });
                req.data = resultInfoEnum.company_not_completed;
                return next();
              }
            });
          }
          else {
            //如果用户没有激活，则发送激活邮件
            if (!userEntity.email_verified) {
              renderData.urlAddress = config.serverAddress + 'user/activate/' + userEntity._id;
              renderData.action = '立即激活';
              renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，激活您的账户。';

              verifyEmail(inputUsername, renderData, function (err, result) {
              });
              req.data = resultInfoEnum.user_activate_email_sent;
              return next();
            }
            else {
              //如果用户没有填写公司信息，则发送登录邮件
              renderData.urlAddress = config.serverAddress + 'zzqs2/index';
              renderData.action = '立即登录';
              renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，登录您的账户。';

              verifyEmail(inputUsername, renderData, function (err, result) {
              });
              req.data = resultInfoEnum.company_not_completed;
              return next();
            }
          }
        });
      }
    }
    else {  //用户不存在
      InviteCompany.findOne({
        username: inputUsername,
        company: currentUser.company._id
      }, function (err, inviteCompany) {
        if (err) {
          req.err = {err: companyError.internal_system_error};
          return next();
        }

        userService.encryptUsername(inputUsername, function (err, encryptUsername) {
          if (err) {
            req.err = {err: err};
            return next();
          }
          //如果没有邀请，则邀请该用户
          if (!inviteCompany) {
            var newInviteCompany = new InviteCompany({
              username: inputUsername,
              company: currentUser.company._id
            });
            newInviteCompany.save(function (err, newInviteCompanyEntity) {
              if (err || !newInviteCompanyEntity) {
                req.err = {err: companyError.internal_system_error};
                return next();
              }
              renderData.urlAddress = config.serverAddress + 'company/company_signup_page?token=' + encryptUsername + '&username=' + inputUsername;
              renderData.action = '立即注册';
              renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，注册您的账户。';

              verifyEmail(inputUsername, renderData, function (err, result) {
              });
              req.data = resultInfoEnum.signup_email_sent;
              return next();
            });
          }
          else {
            renderData.urlAddress = config.serverAddress + 'company/company_signup_page?token=' + encryptUsername + '&username=' + inputUsername;
            renderData.action = '立即注册';
            renderData.description = currentUser.company.name + '邀请您加入柱柱签收网，成为合作伙伴。请点击下方链接，注册您的账户。';

            verifyEmail(inputUsername, renderData, function (err, result) {
            });
            req.data = resultInfoEnum.signup_email_sent;
            return next();
          }
        });

      });
    }
  });
};

//通过公司名来邀请合作公司
exports.inviteByCompanyName = function (req, res, next) {
  var currentUser = req.user || {};
  var companyName = req.body.company_name || '';

  //不能添加自己公司
  if (currentUser.company.name === companyName) {
    req.err = {err: companyError.company_invite_itself};
    return next();
  }
  Company.findOne({name: companyName}, function (err, company) {
    if (err) {
      req.err = {err: companyError.internal_system_error};
      return next();
    }
    //合作公司不存在
    if (!company) {
      req.err = {err: companyError.company_not_exist};
      return next();
    }

    //是否已经为合作公司
    judgeCooperateCompanyExist(currentUser.company._id, company._id, function (err) {
      if (err) {
        req.err = {err: err};
        return next();
      }
      //添加为合作公司
      addNewCompany(currentUser.company._id, company._id, function (err, companyPartner) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = companyPartner;
        return next();
      });
    });
  });
};

exports.batchInviteCompany = function (req, res, next) {
  var currentUser = req.user || {};
  var partnerInfos = req.body.company_infos || [];

  if (!Array.isArray(partnerInfos) || partnerInfos.length === 0) {
    return res.send({err: companyError.invalid_params});
  }

  companyService.batchInviteCompany(currentUser, partnerInfos, function (err, result) {
    return res.send(err || result);
  });
};

exports.create = function (req, res, next) {
  var user = req.user || {};
  var companyName = req.body.name || '',
    address = req.body.address || '',
    photo = req.body.photo || '',
    employes = req.body.employes || '',
    companyType = req.body.type || '';

  if (user.company) {
    req.err = {err: companyError.only_one_company};
    return next();
  }

  Company.findOne({name: companyName}, function (err, company) {
    if (err) {
      req.err = {err: companyError.internal_system_error};
      return next();
    }
    if (company) {
      req.err = {err: companyError.company_name_exists};
      return next();
    }

    var newCompany = new Company();
    newCompany.name = companyName;
    newCompany.address = address;
    newCompany.photo = photo;
    newCompany.employees = employes;
    newCompany.creator = user._id.toString();
    newCompany.type = companyType;

    var newGroup = new Group();
    newGroup.name = 'default_group';
    newGroup.company = newCompany._id;
    newGroup.display_name = '默认组';
    newGroup.description = '默认组，全体员工可见';

    newCompany.default_group = newGroup._id;

    newCompany.save(function (err, newCompanyEntity) {
      if (err) {
        req.err = {err: companyError.internal_system_error};
        return next();
      }

      newGroup.save(function (err, newGroupEntity) {
        if (err || !newGroupEntity) {
          req.err = {err: companyError.internal_system_error};
          return next();
        }

        user.company = newCompanyEntity._id;
        user.roles.push('companyAdmin');
        user.save(function (err, userEntity) {
          if (err || !userEntity) {
            req.err = {err: companyError.internal_system_error};
            return next();
          }

          var newUserGroup = new UserGroup();
          newUserGroup.user = userEntity._id;
          newUserGroup.group = newGroupEntity._id;

          newUserGroup.save(function (err, userGroup) {
            if (err || !userGroup) {
              req.err = {err: companyError.internal_system_error};
              return next();
            }
            //检查是否有没有处理的公司邀请
            InviteCompany.find({username: user.username, status: 'inviting'}, function (err, inviteCompanies) {
              if (err) {
                req.err = {err: companyError.internal_system_error};
                return next();
              }
              //没有合作公司
              if (!inviteCompanies) {
                newCompanyEntity._doc.groups = [newGroupEntity];

                req.data = newCompanyEntity;
                return next();
              }

              async.each(inviteCompanies, function (inviteCompany, itemcallback) {
                inviteCompany.status = 'accepted';
                inviteCompany.save(function (err, inviteCompanyEntity) {
                  if (err || !inviteCompanyEntity) {
                    return itemcallback(companyError.internal_system_error);
                  }
                  else {
                    var newCompanyPartner = new CompanyPartner({
                      company: newCompanyEntity._id,
                      partner: inviteCompanyEntity.company
                    });
                    newCompanyPartner.save(function (err, newCompanyPartnerEntity) {
                      if (err || !newCompanyPartnerEntity) {
                        return itemcallback(companyError.internal_system_error);
                      }

                      return itemcallback();
                    });
                  }
                });
              }, function (err) {
                if (err) {
                  req.err = {err: err};
                  return next();
                }

                newCompanyEntity._doc.groups = [newGroupEntity];

                req.data = newCompanyEntity;
                return next();
              });

            });
          });
        });
      });
    });

  });
};

exports.getPartnerCompanys = function (req, res, next) {
  var user = req.user || {};

  if (!user.company || !user.company._id) {
    return res.send({err: {type: 'user_not_in_company'}});
  }


  var companyPartners = [];
  async.auto({
    findPartnerOne: function (callback) {
      CompanyPartner.find({company: user.company._id}).populate('partner').exec(function (err, partners) {
        if (err) {
          return callback(companyError.internal_system_error);
        }
        else {
          return callback(null, partners);
        }
      });
    },
    findPartnerTwo: function (callback) {
      CompanyPartner.find({partner: user.company._id}).populate('company').exec(function (err, partners) {
        if (err) {
          return callback(companyError.internal_system_error);
        }
        else {
          return callback(null, partners);
        }
      });
    },
    findInviteCompany: function (callback) {
      InviteCompany.find({company: user.company._id, status: 'inviting'}, function (err, inviteCompanies) {
        if (err) {
          return callback(companyError.internal_system_error);
        }
        else {
          return callback(null, inviteCompanies);
        }
      });
    }
  }, function (err, results) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    companyPartners = companyPartners.concat(results.findPartnerOne, results.findPartnerTwo);

    req.data = {partnerCompany: companyPartners, inviteCompany: results.findInviteCompany};
    return next();
  });
};

exports.exportPartnerCompanys = function (req, res, next) {
    var user = req.user || {};

    if (!user.company || !user.company._id) {
        return res.send({err: {type: 'user_not_in_company'}});
    }


    var companyPartners = [];
    async.auto({
        findPartnerOne: function (callback) {
            CompanyPartner.find({company: user.company._id}).populate('partner').exec(function (err, partners) {
                if (err) {
                    return callback(companyError.internal_system_error);
                }
                else {
                    return callback(null, partners);
                }
            });
        },
        findPartnerTwo: function (callback) {
            CompanyPartner.find({partner: user.company._id}).populate('company').exec(function (err, partners) {
                if (err) {
                    return callback(companyError.internal_system_error);
                }
                else {
                    return callback(null, partners);
                }
            });
        },
        findInviteCompany: function (callback) {
            InviteCompany.find({company: user.company._id, status: 'inviting'}, function (err, inviteCompanies) {
                if (err) {
                    return callback(companyError.internal_system_error);
                }
                else {
                    return callback(null, inviteCompanies);
                }
            });
        }
    }, function (err, results) {
        if (err) {
            req.err = {err: err};
            return next(err);
        }

        companyPartners = companyPartners.concat(results.findPartnerOne, results.findPartnerTwo, results.findInviteCompany);
      // 返回excel文件
      var rows = [['公司名称','公司类型','公司地址']];
      for(var i = 0, len = companyPartners.length; i<len; i++){
        var row = [];
        var companyPartner = companyPartners[i];
        row.push((companyPartner.company&&companyPartner.company.name)||(companyPartner.partner&&companyPartner.partner.name)||"");
        row.push((companyPartner.company&&companyPartner.company.type)||(companyPartner.partner&&companyPartner.partner.type)||"");
        row.push((companyPartner.company&&companyPartner.company.address)||(companyPartner.partner&&companyPartner.partner.address)||"");
        rows.push(row);
      }
      var wb = jsxlsxUtil.Workbook();
      var ws = jsxlsxUtil.sheet_from_array_of_arrays(rows);
      var ws_name = '合作公司列表';
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var data = jsxlsxUtil.write(wb, {type: 'buffer'});
      res.setHeader('Content-disposition', 'attachment; filename=companies.xlsx');
      return res.send(new Buffer(data));
    });
};

exports.getPartnerDrivers = function (req, res, next) {
  var user = req.user || {};

  companyService.getPartnerDrivers(user.company._id, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send({driverCompanys: result.findDriverCompany, inviteDrivers: result.findInviteDriver});
  });

};

exports.exportCompanyDriver = function(req, res, next){
  var user = req.user || {};
  companyService.getPartnerDrivers(user.company._id, function (err, result) {
    if (err) {
      return next(err);
    }
    var wb = jsxlsxUtil.Workbook();

    //合作司机
    var rows = [['用户名', '邮箱', '昵称', '身份证号', '手机号码', '驾龄', '驾驶证', '行驶证', '车牌号']];
    var drivers = result.findDriverCompany;
    for(var i = 0, len = drivers.length; i < len; i++){
      var d = drivers[i].driver;
      rows.push([d.username, d.email, d.nickname, d.id_card_number, d.phone, d.driving_date, d.driving_id_number, d.travel_id_number, d.plate_numbers && d.plate_numbers.join(',')]);
    }
    var ws = jsxlsxUtil.sheet_from_array_of_arrays(rows);
    var ws_name = '合作司机';
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;

    // 邀请司机
    var rows1 = [['手机号码']];
    var drivers1 = result.findInviteDriver;
    for(var i = 0, len = drivers1.length; i < len; i++){
      var d = drivers1[i];
      rows1.push([d.username]);
    }
    var ws1 = jsxlsxUtil.sheet_from_array_of_arrays(rows1);
    var ws_name1 = '邀请司机';
    wb.SheetNames.push(ws_name1);
    wb.Sheets[ws_name1] = ws1;

    var data = jsxlsxUtil.write(wb, {type: 'buffer'});
    res.setHeader('Content-disposition', 'attachment; filename=drivers.xlsx');
    return res.send(new Buffer(data));
  });
}

exports.getPartners = function (req, res, next) {
  var user = req.user || {};
  async.auto({
    findPartners: function (callback) {
      CompanyPartner
        .find({$or: [{company: user.company}, {partner: user.company}]})
        .populate('company partner')
        .exec(function (err, companyPartners) {
          if (err) {
            return callback({err: companyError.internal_system_error});
          }
          else {
            return callback(null, companyPartners);
          }
        });
    },
    findDrivers: function (callback) {
      DriverCompany
        .find({company: user.company})
        .populate('driver')
        .exec(function (err, driverCompanys) {
          if (err) {
            return callback({err: companyError.internal_system_error});
          }
          else {
            return callback(null, driverCompanys);
          }
        });
    },
    wrapperObj: ['findPartners', 'findPartners', function (callback, results) {
      var obj = {
        drivers: results.findPartners,
        partners: results.findDrivers
      };
      return callback(null, obj);
    }]
  }, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result.wrapperObj);
  });
};

exports.getPartnerCompanyStaff = function (req, res, next) {
  var user = req.user || {};

  async.auto({
    companyWithStaffs: function (callback) {
      CompanyPartner
        .find({$or: [{company: user.company._id}, {partner: user.company._id}]})
        .exec(function (err, companyPartners) {
          if (err) {
            return callback({err: companyError.internal_system_error});
          }

          var partnerCompanys = [];
          partnerCompanys.push(user.company._id);

          if (companyPartners && companyPartners.length > 0) {
            var userCompanyId = user.company._id.toString();

            companyPartners.forEach(function (partnerCompany) {
              if (partnerCompany.company.toString() !== userCompanyId)
                partnerCompanys.push(partnerCompany.company);
              if (partnerCompany.partner.toString() !== userCompanyId)
                partnerCompanys.push(partnerCompany.partner);
            });
          }

          User.find({company: {$in: partnerCompanys}}, {username: 1, nickname: 1, company: 1})
            .populate('company').exec(function (err, users) {
              if (err) {
                return callback({err: userError.internal_system_error});
              }
              if (!users) {
                return callback({err: userError.user_not_exist});
              }

              return callback(null, {companyIds: partnerCompanys, staffs: users});
            });
        });
    }
  }, function (err, result) {
    if (err) {
      req.err = err;
      return next();
    }
    return res.send(result.companyWithStaffs);
  });
};

exports.getMatchCompanies = function (req, res, next) {
  var user = req.user || {};
  var companyNameSegment = req.body.companyNameSegment || '';

  if (!companyNameSegment) {
    req.err = {err: companyError.name_null};
    return next();
  }

  Company.find({'name': {$regex: companyNameSegment, $options: '$i'}}, {name: 1})
    .sort({'create_time': -1})
    .limit(10)
    .exec(function (err, companyNames) {
      if (err) {
        req.err = {err: companyError.internal_system_error};
        return next();
      }

      return res.send(companyNames);
    });
};

exports.getContactsByKeyword = function (req, res, next) {
  var user = req.user || {};
  var address = req.query.address || '';
  if (!user.company) {
    return res.send([]);
  }
  companyService.getContactAddressList(user.company._id, address, function (err, addressList) {
    return res.send(err || addressList);
  });

  //Contact.find({
  //  company: user.company,
  //  address: {$regex: address, $options: 'i'}
  //}).limit(10).exec(function (err, contacts) {
  //  if (err || !contacts) {
  //    return res.send({err: companyError.internal_system_error});
  //  }
  //  return res.send(contacts);
  //});
};

exports.signUpInviteCompanyPage = function (req, res, next) {
  var encryptUsername = req.query.token || '';

  userService.decryptUsername(encryptUsername, function (err, username) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    userService.isExistUser(username, function (exist, user) {
      //用户不存在，返回注册页面
      if (!exist) {
        return res.render(path.join(__dirname, '../../web/home_page/views/invite_company_signup.client.view.html'));
      }

      //用户未激活，激活用户
      if (!user.email_verified) {
        return res.redirect('/user/activate/' + user._id);
      }

      //否则直接跳转到首页
      return res.redirect('/zzqs2/index');
    });

  });
};

exports.inviteCompanySignup = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';
  var token = req.body.token || '';

  if (!username || !username.testMail()) {
    return res.send({err: userError.invalid_email});
  }
  if (!password || password.length < 6) {
    return res.send({err: userError.invalid_password});
  }

  if (!token) {
    return res.send({err: userError.invalid_access_token});
  }

  userService.decryptUsername(token, function (err, username) {
    if (err) {
      return res.send(err);
    }
    if (!username || !username.testMail()) {
      return res.send({err: userError.account_not_exist});
    }

    userService.getUserByUsername(username, function (err, user) {
      if (err) {
        return res.send(err);
      }

      if (user) {
        req.err = {err: userError.account_exist};
        return next();
      }
      else {
        InviteCompany.findOne({username: username}, function (err, inviteCompanyEntity) {
          if (err) {
            req.err = {err: userError.internal_system_error};
            return next();
          }

          //没有邀请
          if (!inviteCompanyEntity) {
            return res.send({err: companyError.no_invite_record});
            //newUser.save(function (err, newUserEntity) {
            //  if (err) {
            //    req.err = {err: userError.internal_system_error};
            //    return next();
            //  }
            //
            //  var activateUrl = config.serverAddress + 'user/activate/' + newUserEntity._id;
            //  emailLib.sendEmail(newUser.username, '柱柱签收网邮箱注册', '<div>欢迎加入柱柱签收网，请点击</div><a href=' + activateUrl + '>邮箱验证</a>激活您的账号，或复制以下连接到浏览器<br/><a href=' + activateUrl + '>' + activateUrl + '</a>', function (err, result) {
            //    if (err) {
            //      req.err = {err: userError.email_failed};
            //      return next();
            //    }
            //
            //    delete newUserEntity._doc.password;
            //    delete newUserEntity._doc._id;
            //
            //    req.data = {user: newUserEntity};
            //    return next();
            //  });
            //
            //});
          }
          else {  //有邀请记录
            var newUser = new User();
            newUser.password = newUser.hashPassword(password);
            newUser.username = username;

            newUser.email_verified = true;
            newUser.save(function (err, newUserEntity) {
              if (err) {
                req.err = {err: userError.internal_system_error};
                return next();
              }

              var access_token;
              userService.encryptToken(newUserEntity._id, function (err, newToken) {
                if (err) {
                  req.err = {err: err};
                  return next();
                }

                access_token = newToken;
              });

              delete newUserEntity._doc.password;
              delete newUserEntity._doc._id;
              return res.send({user: newUserEntity, access_token: access_token});
            });
          }
        });
      }

    });
  });
};

exports.getAll = function (req, res, next) {

  return res.send('company GetAll ok');
};
exports.getById = function (req, res, next) {

  return res.send('company GetByID ok');
};


/*
 * 删除已邀请司机
 * 1、删除invite_driver
 * 2、司机端不作任何修改
 * 3、订单方面不作任何修改
 *
 * 测试重点
 * 1、删除与未注册司机的关系
 *
 * 客户端参数
 * 1、未注册司机的手机号码
 * */

exports.deleteInviteDriver = function (req, res, next) {
  var driverPhone = req.body.driver_phone || req.query.driver_phone || '';
  var company = req.user.company;

  if (!driverPhone) {
    req.err = {err: companyError.params_null};
    return next();
  }

  companyService.deleteInviteDriver(driverPhone, company._id, function (err, inviteDriverEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {success: true};
    return next();
  });
};

/*
 * 删除合作司机
 * 1、删除driver_company
 * 2、删除invite_driver
 * 3、司机端不作任何修改
 * 4、订单方面不作任何修改
 *
 * 测试重点
 * 1、删除与已注册司机的关系
 *
 * 客户端参数
 * 1、已注册司机的driver_id
 * */
exports.deleteCorporateDriver = function (req, res, next) {
  var driverId = req.body.driver_id || req.query.driver_id || '';
  var company = req.user.company;

  if (!driverId) {
    req.err = {err: companyError.params_null};
    return next();
  }

  driverService.getDriverById(driverId, function (err, driverEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    if (!driverEntity) {
      req.err = {err: companyError.driver_not_exist};
      return next();
    }

    companyService.deleteDriverCompany(driverId, company._id, function (err, driverCompanyEntity) {
      if (err) {
        req.err = {err: err};
        return next();
      }

      companyService.deleteInviteDriver(driverEntity.username, company._id, function (err, inviteDriverEntity) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = {success: true};
        return next();
      });

    });

  });

};

/*
 * 删除已邀请公司
 * 1、删除invite_company
 * 2、司机端不作任何修改
 * 3、订单方面不作任何修改
 *
 * 测试重点
 * 1、删除与未注册公司的关系
 *
 * 客户端参数
 * 1、未注册公司的用户名
 * */
exports.deleteInviteCompany = function (req, res, next) {
  var username = req.body.username || req.query.username || '';
  var company = req.user.company;

  if (!username) {
    req.err = {err: companyError.params_null};
    return next();
  }

  companyService.deleteInviteCompany(username, company._id, function (err, inviteCompanyEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {success: true};
    return next();
  });
};

exports.deleteInviteCompanyById = function (req, res, next) {
  var inviteId = req.body.invite_id || req.query.invite_id || '';
  var company = req.user.company;

  if (!inviteId) {
    req.err = {err: companyError.params_null};
    return next();
  }

  companyService.deleteInviteCompanyById(inviteId, company._id, function (err, inviteCompanyEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {success: true};
    return next();
  });
};

/*
 * 删除合作公司
 * 1、删除company_partner
 * 2、删除invite_company
 *
 * 测试重点
 * 1、删除与已注册公司的关系
 *
 * 客户端参数
 * 1、已注册公司的company_id
 * */
exports.deleteCorporateCompany = function (req, res, next) {
  var partnerCompanyId = req.body.partner_id || req.query.partner_id || '';
  var company = req.user.company;

  if (!partnerCompanyId) {
    req.err = {err: companyError.params_null};
    return next();
  }

  companyService.deleteCorporateCompany(partnerCompanyId, company._id, function (err, companyPartnerEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    companyService.getCompanyAdminUser(partnerCompanyId, function (err, partnerAdminUser) {
      if (err) {
        req.err = {err: err};
        return next();
      }
      if (!partnerAdminUser) {
        req.data = {success: true};
        return next();
      }
      else {
        companyService.deleteInviteCompany(partnerAdminUser.username, company._id, function (err, inviteCompanyEntity) {
          if (err) {
            req.err = {err: err};
            return next();
          }

          req.data = {success: true};
          return next();
        });
      }

    });

  });

};

exports.updateCompanyInfo = function (req, res, next) {
  var info = req.body || {};
  var company = req.user.company;

  delete info.access_token;
  var isModify = false;

  for (var p in info) {
    if (company[p] !== info[p]) {
      company.auth_status = 'processing';
      isModify = true;
      break;
    }
  }

  if (!isModify) {
    return res.send({success: true});
  }

  info.time = new Date();
  company.modify_info = info;
  company.save(function (err, company) {
    if (err || !company) {
      console.log(err);
      return res.send({err: companyError.internal_system_error});
    }
    return res.send(company);
  });
};

/*
 * 删除内部员工
 * 1、删除user_group
 * 2、删除user.company
 *
 * 测试重点
 * 1、删除与已注册公司的关系
 *
 * 客户端参数
 * 1、已注册公司的name
 * 2、已注册用户username
 * */
exports.deleteInternalUser = function (req, res, next) {
  //var username = req.body.username || '';
  //var companyName = req.body.companyName || '';
  //
  //if (!username) {
  //  return res.send({err: {type: 'empty_username'}});
  //}
  //
  //if (!companyName) {
  //  return res.send({err: {type: 'empty_company_name'}});
  //}
  //
  //User.findOne({username: username}).populate('company').exec(function (err, user) {
  //  if (err) {
  //    return res.end({err: {type: 'internal_system_error'}});
  //  }
  //  if (!user) {
  //    return res.send({err: {type: 'user_not_exist'}});
  //  }
  //
  //  if (!user.company) {
  //    return res.send({err: {type: 'user_not_in_a_company'}});
  //  }
  //
  //  if (user.company.name !== companyName) {
  //    return res.send({err: {type: 'user_not_in_this_company'}});
  //  }
  //
  //  UserGroup.find({user: user._id}, function (err, userGroups) {
  //    if (err) {
  //      return res.end({err: {type: 'internal_system_error'}});
  //    }
  //    async.each(userGroups, function (userGroup, callback) {
  //      UserGroup.remove({_id: userGroup._id}, function (err, result) {
  //        if (err) {
  //          return res.send({err: {type: 'internal_system_error'}});
  //        }
  //        console.log('remove result');
  //        console.log(result);
  //        return callback();
  //      });
  //    }, function (err) {
  //      if (err) {
  //        return res.send(err);
  //      }
  //      user.roles = ['user'];
  //      user.company = null;
  //      user.save(function (err, user) {
  //        if (err) {
  //          return res.send({err: {type: 'internal_system_error'}});
  //        }
  //        return res.send(user);
  //      });
  //    });
  //  });
  //});
  //未向外界提供该借口，内部使用时取消注释
  return res.send('未向外界提供该借口，内部使用时取消注释');
};

exports.singleCreateAddress = function (req, res, next) {
  var currentUser = req.user;
  var addressInfo = req.body.address_info || {};

  companyService.createAddress(currentUser.company._id, addressInfo, function (err, address) {
    return res.send(err || address);
  });
};
exports.batchCreateAddress = function (req, res, next) {
  var currentUser = req.user;
  var addressInfos = req.body.address_infos || [];

  if (!Array.isArray(addressInfos) || addressInfos.length === 0) {
    return res.send({err: companyError.invalid_params});
  }

  var successArray = [];
  var failedArray = [];
  async.eachSeries(addressInfos, function (addressItem, asyncCallback) {
    if (!addressItem.detail) {
      failedArray.push({err: companyError.invalid_params, info: addressItem});
      return asyncCallback();
    }
    companyService.createAddress(currentUser.company._id, addressItem, function (err, createAddress) {
      if (err) {
        failedArray.push({err: err.err, info: addressItem});
      }
      else {
        successArray.push({info: addressItem});
      }
      return asyncCallback();
    });

  }, function (err) {

    return res.send({
      success: successArray,
      faileds: failedArray
    });
  });

};
exports.removeAddressById = function (req, res, next) {
  var currentUser = req.user;
  var addressId = req.query.address_id || '';

  companyService.removeAddress(currentUser.company._id, addressId, function (err, raw) {
    return res.send(err || {success: true});
  });
};
exports.updateAddress = function (req, res, next) {
  var currentUser = req.user;
  var addressInfo = req.body.address_info || {};

  companyService.updateAddress(currentUser.company._id, addressInfo, function (err, updateAddress) {
    return res.send(err || {success: true});
  });
};
exports.captureAddress = function (req, res, next) {
  var currentUser = req.user;
  var addressInfo = req.body.addressInfo || {};

  companyService.captureAddress(currentUser.company._id, addressInfo, function (err) {
    return res.send(err || {success: true});
  });
};

exports.getAddressList = function (req, res, next) {
  var currentUser = req.user;

  companyService.getAddressList(currentUser.company._id, function (err, addressList) {
    return res.send(err || addressList);
  });
};
exports.exportAddressList = function (req, res, next) {
    var currentUser = req.user;

    companyService.getAddressList(currentUser.company._id, function (err, addressList) {
      if(err){
        console.log(err);
        next(err);
      }
      // 返回excel文件
      var rows = [['代号','详细地址','经纬度']];
      for(var i = 0, len = addressList.length; i<len; i++){
        var row = [];
        var addressItem = addressList[i];
        row.push(addressItem.brief || '--');
        row.push(addressItem.detail);
        row.push(addressItem.locationString);
        rows.push(row);
      }
      var wb = jsxlsxUtil.Workbook();
      var ws = jsxlsxUtil.sheet_from_array_of_arrays(rows);
      var ws_name = '地址列表';
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var data = jsxlsxUtil.write(wb, {type: 'buffer'});
      res.setHeader('Content-disposition', 'attachment; filename=address.xlsx');
      return res.send(new Buffer(data));
    });
};

//车辆管理Server
exports.singleCreateVehicle = function (req, res, next) {
  var currentUser = req.user;
  var vehicleInfo = req.body.vehicle_info || {};

  companyVehicleService.createVehicle(currentUser.company._id, vehicleInfo, function (err, vehicle) {
    return res.send(err || vehicle);
  });
};
exports.batchCreateVehicle = function (req, res, next) {
  var currentUser = req.user;
  var vehicleInfos = req.body.vehicle_infos || [];

  if (!Array.isArray(vehicleInfos) || vehicleInfos.length === 0) {
    return res.send({err: companyError.invalid_params});
  }

  var successArray = [];
  var failedArray = [];
  async.eachSeries(vehicleInfos, function (vehicleItem, asyncCallback) {
    if (!vehicleItem.plate_number) {
      failedArray.push({err: companyError.invalid_params, info: vehicleItem});
      return asyncCallback();
    }
    companyVehicleService.createVehicle(currentUser.company._id, vehicleItem, function (err, createVehicle) {
      if (err) {
        failedArray.push({err: err.err, info: vehicleItem});
      }
      else {
        successArray.push({info: vehicleItem});
      }
      return asyncCallback();
    });

  }, function (err) {

    return res.send({
      success: successArray,
      faileds: failedArray
    });
  });

};
exports.removeVehicleById = function (req, res, next) {
  var currentUser = req.user;
  var vehicleId = req.query.vehicle_id || '';

  companyVehicleService.removeVehicle(currentUser.company._id, vehicleId, function (err, raw) {
    return res.send(err || raw);
  });
};
exports.updateVehicle = function (req, res, next) {
  var currentUser = req.user;
  var vehicleInfo = req.body.vehicle_info || {};

  companyVehicleService.updateVehicle(currentUser.company._id, vehicleInfo, function (err, updateVehicle) {
    return res.send(err || {success: true});
  });
};
exports.getVehicleList = function (req, res, next) {
  var currentUser = req.user;

  companyVehicleService.getVehicleList(currentUser.company._id, function (err, vehicleList) {
    return res.send(err || vehicleList);
  });
};

exports.getConfiguration = function (req, res, next) {
  var currentUser = req.user;

  companyService.getConfiguration(currentUser.company._id, function (err, configuration) {
    return res.send(err || configuration);
  });
};

exports.updateOrderConfiguration = function (req, res, next) {
  var currentUser = req.user;
  var pickupOption = req.body.pickup_option;
  var deliveryOption = req.body.delivery_option;

  if (!pickupOption || !deliveryOption) {
    return res.send({err: companyError.invalid_params});
  }

  pickupOption.entrance_photos = pickupOption.entrance_photos || [];
  pickupOption.take_photos = pickupOption.take_photos || [];
  deliveryOption.entrance_photos = deliveryOption.entrance_photos || [];
  deliveryOption.take_photos = deliveryOption.take_photos || [];

  companyService.updateConfiguration(currentUser.company._id,
    {
      pickup_option: pickupOption,
      delivery_option: deliveryOption
    },
    function (err, configuration) {
      if (err) {
        return res.send(err);
      }

      //更新个人设置
      userProfileService.setOrderConfiguration(currentUser._id,
        {
          pickupEntrance: configuration.pickup_option.must_entrance,
          pickupPhoto: configuration.pickup_option.must_take_photo,
          deliveryEntrance: configuration.delivery_option.must_entrance,
          deliveryPhoto: configuration.delivery_option.must_take_photo
        },
        function (err, profile) {
          return res.send(configuration);
        });
    });
};

exports.updatePushConfiguration = function (req, res, next) {
  var currentUser = req.user;
  var pushOption = req.body.push_option;

  if (!pushOption) {
    return res.send({err: companyError.invalid_params});
  }

  pushOption.abnormal_push = pushOption.abnormal_push === 'true' ? true : false;

  pushOption.create_push = pushOption.create_push === 'true' ? true : false;
  pushOption.delivery_sign_push = pushOption.delivery_sign_push === 'true' ? true : false;

  pushOption.pickup_push = pushOption.pickup_push === 'true' ? true : false;
  pushOption.delivery_push = pushOption.delivery_push === 'true' ? true : false;

  pushOption.pickup_deferred_duration = parseInt(pushOption.pickup_deferred_duration) || 0;
  pushOption.delivery_early_duration = parseInt(pushOption.delivery_early_duration) || 0;

  companyService.updateConfiguration(currentUser.company._id,
    {
      push_option: pushOption
    },
    function (err, configuration) {
      return res.send(err || configuration);
    });
};
exports.exportCompanies = function(req, res, next){

};
exports.findDriverEvaluations = function(req, res, next){
  var driverId = req.query.driverId;
  var currentPage = parseInt(req.query.currentPage);
  var limit = parseInt(req.query.limit);

  driverEvaluationService.findDriverEvaluations(driverId, currentPage, limit, function (err, evaluationList, total) {
    if (err) {
      return res.send({status : 'error', message : err});
    }
    return res.send({status : 'success', data : evaluationList, pagination : {currentPage : currentPage, limit : limit, total : total}});
  });
};