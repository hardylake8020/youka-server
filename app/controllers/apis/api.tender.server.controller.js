/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var tenderService = require('../../../libraries/services/tender'),
    appDb = require('../../../libraries/mongoose').appDb,
    Company = appDb.model('Company'),
    cryptoLib = require('../../libraries/crypto'),
    error = require('../../../errors/all'),
    companyError = require('../../errors/company'),
    CompanyKey = appDb.model('CompanyKey'),
    Tender = appDb.model('Tender');

exports.generateApiKey = function (req, res, next) {
    var companyName = req.query.companyName || '';
    if (companyName === '') {
        return res.send({err: {type: 'invalid_company_name'}});
    }

    Company.findOne({name: companyName}, function (err, company) {
        if (err) {
            console.error(err);
            return res.send({err: companyError.internal_system_error});
        }

        if (!company) {
            return res.send({err: companyError.company_not_exist});
        }

        var pk = cryptoLib.encryptString({
            name: company.name,
            time: new Date().getMilliseconds()
        }, 'api_pk');

        var sk = cryptoLib.encryptString({
            name: company.name,
            time: new Date().getMilliseconds()
        }, 'api_sk');

        var md5str = cryptoLib.toMd5(pk + '&' + sk);

        CompanyKey.findOne({company: company._id}, function (err, companyKey) {
            if (err) {
                return res.send({err: companyError.internal_system_error});
            }

            if (!companyKey) {
                companyKey = new CompanyKey({
                    company: company._id
                });
            }
            companyKey.public_key = pk;
            companyKey.secret_key = sk;
            companyKey.md5_str = md5str;
            companyKey.save(function (err, result) {
                if (err || !result) {
                    return res.send({err: companyError.internal_system_error});
                }
                return res.send(result);
            });
        });
    });
};

exports.createTender = function (req, res, next) {
    var currentUser = req.user;
    var tenderInfo = req.body.tender_info;
    currentUser.company_id = req.body.company_id;

    if(!tenderInfo){
        return res.send({err : {type : 'tender_info_not_exists', message : 'tender_info 不存在！'}});
    }else if(typeof tenderInfo == 'string'){
        try {
            tenderInfo = JSON.parse(tenderInfo);
        }
        catch (e) {
            return res.send({err: {type: 'invalid_tender_info'}});
        }
    }
    if(!tenderInfo){
        return res.send({err: {type: 'invalid_tender_info'}});
    }
    tenderInfo.auto_close_duration = parseInt(tenderInfo.auto_close_duration) || 0;
    if (tenderInfo.auto_close_duration < 1 || tenderInfo.auto_close_duration > 60) {
        tenderInfo.auto_close_duration = 10;
    }
    tenderService.create(currentUser, tenderInfo, function (err) {
        if (err) {
            return res.send(err.err||err);
        }
        return res.send({success: true});
    });
};

exports.createTenders = function (req, res, next) {
    var currentUser = req.user;
    var tenderInfos = req.body.tender_infos;
    currentUser.company_id = req.body.company_id;

    if(!tenderInfos){
        return res.send({err : {type : 'tender_infos_not_exists', message : 'tender_infos 不存在！'}});
    }else if(typeof tenderInfos == 'string'){
        try {
            tenderInfos = JSON.parse(tenderInfos);
        }
        catch (e) {
            return res.send({err: {type: 'invalid_tender_infos'}});
        }
    }
    if(!tenderInfos){
        return res.send({err: {type: 'invalid_tender_infos'}});
    }

    var created = 0;
    var errorCount= 0;
    var successCount= 0;
    var error;
    var total = tenderInfos.length;
    if(total <= 0 ){
        return res.send({err: {type: 'invalid_tender_infos', message: 'tender_infos could not be null'}});
    }
    for(var i= 0;i<total;i++){
        var tenderInfo = tenderInfos[i];
        tenderInfo.auto_close_duration = parseInt(tenderInfo.auto_close_duration) || 0;
        if (tenderInfo.auto_close_duration < 1 || tenderInfo.auto_close_duration > 60) {
            tenderInfo.auto_close_duration = 10;
        }
        tenderService.create(currentUser, tenderInfo, function (err) {
            created++;
            if (err) {
                errorCount++;
                error = err.err||err;
            }else{
                successCount++;
            }
            if(created == total){
                var result = {success: errorCount==0, succeed: successCount, failed: errorCount};
                if(error){
                    result.err = error;
                }
                return res.send(result);
            }
        });
    }
};

exports.queryBidWinner = function(req, res, next){
    var order_number = req.query.order_number || req.body.order_number;
    if(!order_number){
        return res.send({err: 'order_number is required'});
    }

    Tender.find({order_number: order_number, create_company: req.company._id},
      {bidder_winner: 1, order: 1, winner_price: 1, carry_drivers: 1, status: 1}).populate('bidder_winner order').lean().exec(function(err, docs){
          if(err){
              console.log('api.tender.queryBidWinner', err);
              return res.send({err: 'an internal error occurred'});
          }
          var a = [];
        docs.forEach(function (doc) {
            if(doc.status == 'completed'){
                var drivers = [];
                doc.carry_drivers.forEach(function (driver) {
                    drivers.push({
                        mobile_phone: driver.username, //分配司机的手机号
                        plate_numbers: driver.plate_numbers //司机车牌号
                    });
                });
                a.push({
                    winner: {
                        mobile_phone: doc.bidder_winner.username, //中标人手机号
                        price: doc.winner_price //中标价格
                    },
                    drivers: drivers
                });
            }
        });
        if(a.length == 0 && docs.length > 0){
            return res.send({err: 'tender has not completed'});
        }
        res.send(a);
    });
};













