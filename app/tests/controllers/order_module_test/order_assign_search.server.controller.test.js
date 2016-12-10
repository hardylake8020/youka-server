/**
 * Created by louisha on 15/6/12.
 */

'use strict';


var mongoose = require('mongoose'),
    appDb = require('../../../../libraries/mongoose').appDb,
    should = require('should'),
    superagent = require('superagent'),
    agent = superagent.agent(),
    config = require('../../../../config/config'),
    Order = appDb.model('Order'),
    OrderDetail = appDb.model('OrderDetail'),
    Contact = appDb.model('Contact'),
    User = appDb.model('User'),
    UserGroup = appDb.model('UserGroup'),
    Company = appDb.model('Company'),
    Group = appDb.model('Group');

//开放注册
function userSignup(username, password, callback) {
    agent.post(config.serverAddress + 'user/signup')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            username: username,
            password: password
        })
        .end(function (err, res) {
            res.body.username.should.equal(username);
            should.not.exist(res.body.company);
            callback(res.body);
        });
}

//用户激活
function userActivate(user_id, callback) {
    agent.get(config.serverAddress + 'user/activate/' + user_id)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .end(function (err, res) {
            User.findOne({_id: user_id}, function (err, user) {
                user.email_verified.should.equal(true);
                callback(res.body);
            });
        });
}

//用户登录，返回用户和access_token
function userSignin(username, password, callback) {
    agent.post(config.serverAddress + 'user/signin')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            username: username,
            password: password
        })
        .end(function (err, res) {
            res.body.user.email_verified.should.equal(true);
            callback(res.body);
        });
}

//创建公司返回公司
function createComany(name, address, photo, emplyees, access_token, callback) {
    agent.post(config.serverAddress + 'company')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            name: name,
            address: address,
            photo: photo,
            employes: emplyees,
            access_token: access_token
        })
        .end(function (err, res) {
            callback(res.body);
        });
}

//邀请合作公司
function inviteCompany(company_name, access_token, callback) {
    agent.post(config.serverAddress + 'company/invitebycompanyname')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            company_name: company_name,
            access_token: access_token
        })
        .end(function (err, res) {
            callback(err, res.body);
        });
}

//创建订单
function createOrder(orderInfo, groupId, access_token, callback) {
    agent.post(config.serverAddress + 'order')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            order: orderInfo,
            group_id: groupId,
            access_token: access_token
        })
        .end(function (err, res) {
            callback(res.body);
        });
}

//分配订单
function assignOrder(access_token, orderId, assignInfos, callback) {
    agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            access_token: access_token,
            order_id: orderId,
            assign_infos: assignInfos
        })
        .end(function (err, res) {
            callback(err, res.body);
        });
}

//分配运单关键字搜索
function getAssignOrderByKeyWordSearch(access_token,searchName, searchValue, callback) {
  var searchArray = [];
  searchArray.push({key: searchName, value: searchValue});
    agent.post(config.serverAddress + 'order/unassigned')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            access_token: access_token,
            sortName: '',
            sortValue: '',
            searchArray: searchArray
        })
        .end(function (err, res) {
            callback(err, res.body);
        });
}

//分配运单字段排序
function getAssignOrderByKeyWordSort(access_token,sortName, sortValue, callback) {
  var searchArray = [];
    agent.post(config.serverAddress + 'order/unassigned')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            access_token: access_token,
            sortName: sortName,
            sortValue: sortValue,
            searchArray: searchArray
        })
        .end(function (err, res) {
            callback(err, res.body);
        });
}

describe('Get order by search or sort in order assign Module Unit Tests', function () {
    var userA, userB, userC, companyA, companyB, companyC, orderA, orderB, orderC, assignInfoA, assignInfoB;
    before(function (done) {
        userA = {username: '541149886@qq.com', password: '111111'};
        userB = {username: '595631400@qq.com', password: '111111'};
        userC = {username: '10983066@qq.com', password: '111111'};

        companyA = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
        companyB = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
        companyC = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};

        assignInfoA = [{
            type: 'company',
            company_id: '',
            pickup_contact_name: 'louisha',
            pickup_contact_phone: '01032147895',
            pickup_contact_mobile_phone: '13052118915',
            pickup_contact_email: '',
            delivery_contact_name: 'hardy',
            delivery_contact_phone: '',
            delivery_contact_mobile_phone: '',
            delivery_contact_address: '',
            delivery_contact_email: ''
        },
            {
                type: 'company',
                company_id: '',
                pickup_contact_name: 'elina',
                pickup_contact_phone: '01032147895',
                pickup_contact_mobile_phone: '18321740710',
                pickup_contact_email: '',
                delivery_contact_name: 'hardy',
                delivery_contact_phone: '',
                delivery_contact_mobile_phone: '',
                delivery_contact_address: '',
                delivery_contact_email: ''
            }];

        assignInfoB = {
            type: 'company',
            company_id: '',
            pickup_contact_name: 'louisha',
            pickup_contact_phone: '01032147895',
            pickup_contact_mobile_phone: '13052118915',
            pickup_contact_email: '',
            delivery_contact_name: 'hardy',
            delivery_contact_phone: '',
            delivery_contact_mobile_phone: '',
            delivery_contact_address: '',
            delivery_contact_email: ''
        };

        orderA = {
            order_number: 'A123',
            goods_name: 'aaaaaaa',
            customer_name: 'AAAAAA',
            pickup_start_time: new Date(),
            delivery_start_time: new Date(),
            pickup_end_time: new Date(),
            delivery_end_time: new Date(),
            description: 'description for orderA'
        };

        orderB = {
            order_number: 'B12',
            goods_name: 'bbbbbbb',
            customer_name: 'BBBBBBB',
            pickup_start_time: new Date(),
            delivery_start_time: new Date(),
            pickup_end_time: new Date(),
            delivery_end_time: new Date(),
            description: 'description for orderB'
        };

        orderC = {
            order_number: 'C123',
            goods_name: 'cccccaa',
            customer_name: 'CCCCCCC',
            pickup_start_time: new Date(),
            delivery_start_time: new Date(),
            pickup_end_time: new Date(),
            delivery_end_time: new Date(),
            description: 'description for orderC'
        };


        UserGroup.remove(function () {
            User.remove(function () {
                Company.remove(function () {
                    Group.remove(function () {
                        Contact.remove(function () {
                            OrderDetail.remove(function () {
                                Order.remove(function () {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
    describe('test for get order when handel sort or input search key by filed in order assign list', function () {
        var user_A, user_B, user_C, access_token_A, access_token_B, access_token_C,
            company_A, company_B, company_C, order_A, order_B, order_C;

        it('should return user_A when userA sign up', function (done) {
            userSignup(userA.username, userA.password, function (userEntity) {
                userEntity.username.should.equal(userA.username);

                user_A = userEntity;
                userActivate(userEntity._id, function (result) {
                    done();
                });
            });
        });

        it('should return user_B when userB sign up', function (done) {
            userSignup(userB.username, userB.password, function (userEntity) {
                userEntity.username.should.equal(userB.username);

                user_B = userEntity;
                userActivate(userEntity._id, function (result) {
                    done();
                });
            });
        });

        it('should return user_C when userC sign up', function (done) {
            userSignup(userC.username, userC.password, function (userEntity) {
                userEntity.username.should.equal(userC.username);

                user_C = userEntity;
                userActivate(userEntity._id, function (result) {
                    done();
                });
            });
        });

        //用户登录
        it('should return the access_token_A of user_A', function (done) {
            userSignin(userA.username, userA.password, function (result) {
                should.not.exist(result.err);
                access_token_A = result.access_token;
                done();
            });
        });

        it('should return the access_token_B of user_B', function (done) {
            userSignin(userB.username, userB.password, function (result) {
                should.not.exist(result.err);
                access_token_B = result.access_token;
                done();
            });
        });

        it('should return the access_token_C of user_C', function (done) {
            userSignin(userC.username, userC.password, function (result) {
                should.not.exist(result.err);
                access_token_C = result.access_token;
                done();
            });
        });

        //用户创建公司
        it('should return the company_A of user_A', function (done) {
            createComany(companyA.name, companyA.address, companyA.photo, companyA.employees, access_token_A, function (companyEntity) {
                companyEntity.name.should.equal(companyA.name);
                companyEntity.address.should.equal(companyA.address);
                company_A = companyEntity;
                done();
            });
        });

        it('should return the company_B of user_B', function (done) {
            createComany(companyB.name, companyB.address, companyB.photo, companyB.employees, access_token_B, function (companyEntity) {
                companyEntity.name.should.equal(companyB.name);
                companyEntity.address.should.equal(companyB.address);
                company_B = companyEntity;
                done();
            });
        });

        it('should return the company_C of user_C', function (done) {
            createComany(companyC.name, companyC.address, companyC.photo, companyC.employees, access_token_C, function (companyEntity) {
                companyEntity.name.should.equal(companyC.name);
                companyEntity.address.should.equal(companyC.address);
                company_C = companyEntity;
                done();
            });
        });

        //邀请合作公司
        it('should be success when companyA invite companyB', function (done) {
            inviteCompany(companyB.name, access_token_A, function (err, result) {
                should.not.exist(result.err);
                result.partner.toString().should.equal(company_B._id.toString());
                done();
            });
        });

        it('should be success when companyA invite companyC', function (done) {
            inviteCompany(companyC.name, access_token_A, function (err, result) {
                should.not.exist(result.err);
                result.partner.toString().should.equal(company_C._id.toString());
                done();
            });
        });

        it('should be success when companyB invite companyC', function (done) {
            inviteCompany(companyC.name, access_token_B, function (err, result) {
                should.not.exist(result.err);
                result.partner.toString().should.equal(company_C._id.toString());
                done();
            });
        });

        //创建运单
        it('should return the order_A created by user_A', function (done) {
            createOrder(orderA, company_A.default_group, access_token_A, function (result) {
                should.not.exist(result.err);
                result.status.should.equal('unAssigned');
                order_A = result;
                done();
            });
        });

        it('should return the order_B created by user_B', function (done) {
            createOrder(orderB, company_B.default_group, access_token_B, function (result) {
                should.not.exist(result.err);
                result.status.should.equal('unAssigned');
                order_B = result;
                done();
            });
        });

        it('should return the order_C created by user_C', function (done) {
            createOrder(orderC, company_C.default_group, access_token_C, function (result) {
                should.not.exist(result.err);
                result.status.should.equal('unAssigned');
                order_C = result;
                done();
            });
        });

        //分配运单
        it('should be success when assign order_A to companyB, companyC', function (done) {
            assignInfoA[0].company_id = company_B._id.toString();
            assignInfoA[1].company_id = company_C._id.toString();

            assignOrder(access_token_A, order_A._id.toString(), assignInfoA, function (err, result) {
                should.exist(result.assignedInfos);
                done();
            });
        });

        it('should be success when assign order_B to companyC', function (done) {
            assignInfoB.company_id = company_C._id.toString();

            assignOrder(access_token_B, order_B._id.toString(), assignInfoB, function (err, result) {
                should.exist(result.assignedInfos);
                done();
            });
        });


        it('should be success when input keyword by search order_number', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'order_number', '123', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                //console.log('========='+JSON.stringify(result));
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search order_number', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'order_number', '12', function (err, result) {
              should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1); //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search order_number', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'order_number', 'A', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search order_number', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'order_number', '', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);  //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search goods_name', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'goods_name', 'aa', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search goods_name', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'goods_name', 'bb', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(0); //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search goods_name', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'goods_name', 'cc', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(0); //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search goods_name', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'goods_name', '', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1); //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search source', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'source', 'company', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search source', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'source', 'B', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                //console.log('========='+JSON.stringify(result));
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search source', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'source', '', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1); //只获取未分配和分配钟的运单
                done();
            });
        });

        it('should be success when input keyword by search description', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'description', 'for', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search description', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'description', '', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search description', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'description', 'order', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when input keyword by search description', function (done) {

            getAssignOrderByKeyWordSearch(access_token_B,'description', 'A', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                result.totalCount.should.equal(1);
                done();
            });
        });

        it('should be success when sort by order_number asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'order_number', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by order_number desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'order_number', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by goods_name asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'goods_name', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by goods_name desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'goods_name', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });


        it('should be success when sort by source asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'source', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by source desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'source', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by description asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'description', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by description desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'description', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by pickup_start_time asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'pickup_start_time', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by pickup_start_time desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'pickup_start_time', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by delivery_start_time asc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'delivery_start_time', '1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });

        it('should be success when sort by delivery_start_time desc', function (done) {

            getAssignOrderByKeyWordSort(access_token_B,'delivery_start_time', '-1', function (err, result) {
                should.not.exist(err);
                should.not.exist(result.err);
                done();
            });
        });


    });

    after(function (done) {
        UserGroup.remove(function () {
            User.remove(function () {
                Company.remove(function () {
                    Group.remove(function () {
                        Contact.remove(function () {
                            OrderDetail.remove(function () {
                                Order.remove(function () {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

});