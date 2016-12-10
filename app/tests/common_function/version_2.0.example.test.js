/**
* 测试用例文档说明 + 示例
* Created by Wayne on 15/7/24.
* Version: 2.0
* Common function provide numbers of basic way to access backend with sending http request to server.
* Now it is very easy for us to write our backend unit test which is recommend to strength our code.
* Please use the new version way to create your unit test if you want to.
*
*/

/*
* 原则：不要在单元测试中留下log信息，导致输出非常多。log输出可以用来定位问题，希望在测试通过后删除。
* 示例如下
*/

/*
 * 测试模块：运单分配
 * 测试目标：分配完成后，会产生分配时间，execute_drivers, execute_companies.
 * 所有入口：第一次分配，继续分配，批量分配
 * */

//var CompanyWebAPI = require('../../common_function/core_business_logic/company'),
//  DriverWebAPI = require('../../common_function/core_business_logic/driver'),
//  OrderWebAPI = require('../../common_function/core_business_logic/order'),
//  TransportEventWebAPI = require('../../common_function/core_business_logic/transport_event'),
//  UserWebAPI = require('../../common_function/core_business_logic/user');
//
//var mongoose = require('mongoose'),
//  should = require('should'),
//  superagent = require('superagent'),
//  agent = superagent.agent(),
//  config = require('../../../config/config');
//
//var appDb = require('../../libraries/mongoose').appDb,
//  Order = appDb.model('Order'),
//  OrderDetail = appDb.model('OrderDetail'),
//  Contact = appDb.model('Contact'),
//  User = appDb.model('User'),
//  UserGroup = appDb.model('UserGroup'),
//  Company = appDb.model('Company'),
//  Group = appDb.model('Group'),
//  CustomerContact = appDb.model('CustomerContact'),
//  InviteDriver = appDb.model('InviteDriver'),
//  Driver = appDb.model('Driver'),
//  DriverCompany = appDb.model('DriverCompany'),
//  TransportEvent = appDb.model('TransportEvent'),
//  Trace = appDb.model('Trace');
//
//describe('which controller for test', function () {
//
//  before(function (done) {
//    UserGroup.remove(function () {
//      User.remove(function () {
//        Company.remove(function () {
//          Group.remove(function () {
//            Contact.remove(function () {
//              OrderDetail.remove(function () {
//                Order.remove(function () {
//                  CustomerContact.remove(function () {
//                    InviteDriver.remove(function () {
//                      Driver.remove(function () {
//                        DriverCompany.remove(function () {
//                          TransportEvent.remove(function () {
//                            Trace.remove(function(){
//                              done();
//                            })
//                          });
//                        });
//                      });
//                    });
//                  });
//                });
//              });
//            });
//          });
//        });
//      });
//    });
//  });
//
//  describe('Prepare Data For Test::', function () {
//
//  });
//  describe('which function for test', function () {
//
//    it('should be like what when you do something', function (done) {
//      //调用Web接口
//      //检查返回的结果是否与预期一致
//      //done();
//    });
//  });
//
//  describe('which function for test', function () {
//
//    it('should be like what when you do something', function (done) {
//      //调用Web接口
//      //检查返回的结果是否与预期一致
//      //done();
//    });
//  });
//
//  after(function (done) {
//    UserGroup.remove(function () {
//      User.remove(function () {
//        Company.remove(function () {
//          Group.remove(function () {
//            Contact.remove(function () {
//              OrderDetail.remove(function () {
//                Order.remove(function () {
//                  CustomerContact.remove(function () {
//                    InviteDriver.remove(function () {
//                      Driver.remove(function () {
//                        DriverCompany.remove(function () {
//                          TransportEvent.remove(function () {
//                            Trace.remove(function(){
//                              done();
//                            })
//                          });
//                        });
//                      });
//                    });
//                  });
//                });
//              });
//            });
//          });
//        });
//      });
//    });
//  });
//
//});