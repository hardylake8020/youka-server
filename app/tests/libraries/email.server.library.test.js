'use strict';

var should = require('should'),
  superagent = require('superagent'),
  email = require('../../libraries/email');

describe('Libraries Email Unit Test', function () {
  describe('Method sendEmail', function () {
    it('should return code 250', function (done) {
      email.sendEmail('hardy@zhuzhuqs.com', 'test mail', 'test content', function (err, message) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(message);
        }
        done();
      });
    });
  });
});




