//'use strict';
//
///**
// * Module dependencies.
// */
//var should = require('should'),
//  mongoose = require('mongoose'),
//  appDb = require('../../libraries/mongoose').appDb,
//  User = appDb.model('User');
//
///**
// * Globals
// */
//var user, user2;
//
///**
// * Unit tests
// */
//describe('User Model Unit Tests:', function () {
//  before(function (done) {
//    User.remove(function(){
//
//      user = new User({
//        firstName: 'Full',
//        lastName: 'Name',
//        displayName: 'Full Name',
//        email: 'test@test.com',
//        username: 'username',
//        password: 'password',
//        provider: 'local'
//      });
//      user2 = new User({
//        firstName: 'Full',
//        lastName: 'Name',
//        displayName: 'Full Name',
//        email: 'test@test.com',
//        username: 'username',
//        password: 'password',
//        provider: 'local'
//      });
//
//      done();
//    });
//  });
//
//  describe('Method Save', function () {
//    it('should begin with no users', function (done) {
//      User.find({}, function (err, users) {
//        users.should.have.length(0);
//        done();
//      });
//    });
//
//    it('should be able to save without problems', function (done) {
//      user.save(done);
//    });
//
//    it('should fail to save an existing user again', function (done) {
//      user.save();
//      return user2.save(function (err) {
//        should.exist(err);
//        done();
//      });
//    });
//
//    it('should be able to save without first name', function (done) {
//      user.firstName = '';
//      return user.save(function (err) {
//        should.not.exist(err);
//        done();
//      });
//    });
//
//    it('should be able to save without last name', function (done) {
//      user.lastName = '';
//      return user.save(function (err) {
//        should.not.exist(err);
//        done();
//      });
//    });
//
//    it('should be able to save without display name', function (done) {
//      user.displayName = '';
//      return user.save(function (err) {
//        should.not.exist(err);
//        done();
//      });
//    });
//
//    it('should be able to save without email', function (done) {
//      user.email = '';
//      return user.save(function (err) {
//        should.not.exist(err);
//        done();
//      });
//    });
//  });
//
//  before(function (done) {
//    User.remove(function(){
//
//      user = new User({
//        firstName: 'Full',
//        lastName: 'Name',
//        displayName: 'Full Name',
//        email: 'test@test.com',
//        username: 'username',
//        password: 'password',
//        provider: 'local'
//      });
//      user2 = new User({
//        firstName: 'Full',
//        lastName: 'Name',
//        displayName: 'Full Name',
//        email: 'test@test.com',
//        username: 'username',
//        password: 'password',
//        provider: 'local'
//      });
//
//      done();
//    });
//  });
//
//});
