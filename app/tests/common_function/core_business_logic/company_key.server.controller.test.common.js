/**
 * Created by Wayne on 15/7/24.
 */
'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

//声称第三方公司密钥
exports.generateCompanyKeys = function(companyName, callback) {
  agent.get(config.serverAddress + 'api/keys')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .query({
      companyName: companyName
    })
    .end(function (err, res) {
      should.exist(res.body.public_key);
      should.exist(res.body.secret_key);
      should.exist(res.body.company);
      callback(err, res.body);
    });
};
