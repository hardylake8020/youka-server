///**
// * Created by louisha on 15/5/17.
// */
//'use strict';
//
//var mongoose = require('mongoose'),
//    appDb = require('../../libraries/mongoose').appDb,
//    super_agent = require('superagent'),
//    agent = super_agent.agent(),
//    config = require('../../../config/config'),
//    orderError = require('../../errors/order'),
//    UserGroup = appDb.model('UserGroup');
//
//
////照片搜索查询
//function doSearchDriverPhoto(paramsObj, callback) {
//    agent.post(config.serverAddress + 'photoSearch')
//        .set('Content-Type', 'application/x-www-form-urlencoded')
//        .send(paramsObj)
//        .end(function (err, res) {
//            if (err)
//                console.log(err);
//            callback(res.body);
//        });
//}
//
////需要用户登录，返回用户和access_token
//function userSignin(username, password, callback) {
//    agent.post(config.serverAddress + 'user/signin')
//        .set('Content-Type', 'application/x-www-form-urlencoded')
//        .send({
//            username: username,
//            password: password
//        })
//        .end(function (err, res) {
//            if (err)
//                console.log(err);
//            callback(res.body);
//        });
//}
//
//describe('Photo search by any custom param', function () {
//    var filter = {};
//    before(function (done) {
//        filter = {
//            orderNo: '2015',
//            custom: '',
//            isDamage: false,
//            driver: '130',
//            carriers: '大白',
//            startTime: new Date('1970-1-1 00:00:00'),
//            endTime: new Date()
//        };
//    });
//    //用户登录done
//    var user_access_token = '';
//    it('should return the access_token of the user', function (done) {
//        userSignin('louisha@zhuzhuqs.com', '111111', function (result) {
//            user_access_token = result.access_token;
//            done();
//        });
//    });
//
//    it('Search photo with params', function (done) {
//        filter.access_token = user_access_token;
//        doSearchDriverPhoto(filter, function (result) {
//            console.log(result);
//            done();
//        });
//    });
//});