'use strict';

var assert = require('assert');
var Xrate = require('../index.js');

describe('x-rate request, no queue use', function () {

  before(function () {
    var self = this;
    this.limits = {
      limit: 60,
      remaining: 5,
      reset: 5
    };
    this.request = function (options, callback) {
      var response = {
        headers: {
          'X-Rate-Limit-Limit': self.limits.limit,
          'X-Rate-Limit-Remaining': --self.limits.remaining,
          'X-Rate-Limit-Reset': self.limits.reset
        }
      };
      var body = 'hello';
      callback(null, response, body);
    };
  });

  it('requests 5', function (done) {
    var callback = function () {
      assert.equal(xRate.queue.length, 0);
      done();
    };
    var xRate = new Xrate(this.request, callback);
    var xreq = xRate.getMethod(this.request);
    for (var i = 0; i < 5; i++) {
      xreq({}, function(){});
    }
  });

});

describe('x-rate request, use queue', function () {

  before(function () {
    var self = this;
    this.limits = {
      limit: 5,
      remaining: 5,
      reset: 0
    };
    this.request = function (options, callback) {
      var response = {
        headers: {
          'X-Rate-Limit-Limit': self.limits.limit,
          'X-Rate-Limit-Remaining': (self.limits.remaining > 0) ? --self.limits.remaining : self.limits.remaining,
          'X-Rate-Limit-Reset': ++self.limits.reset
        }
      };
      var body = 'hello';
      callback(null, response, body);
    };
  });

  it('requests 10', function (done) {
    this.timeout(10000);
    var callback = function () {
      assert.equal(xRate.queue.length, 0);
      done();
    };
    var xRate = new Xrate(this.request, callback);
    var xreq = xRate.getMethod();
    for (var i = 0; i < 10; i++) {
      xreq({ url: 'localhost' }, function(){});
    }
  });

});
