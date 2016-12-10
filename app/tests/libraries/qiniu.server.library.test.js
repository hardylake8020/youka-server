'use strict';

var qiniu = require('../../libraries/qiniu');

describe('Library Qiniu Cloud Unit Test', function () {
  describe('Method upToken', function () {
    it('should return a token', function (done) {
      var putPolicy = new qiniu.rs.PutPolicy('liuyipublic');
      console.log(putPolicy.token());
      done();
    });
  });
});
