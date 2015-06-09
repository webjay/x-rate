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
      reset: 2
    };
    this.request = function (options, callback) {
      var response = {
        headers: {
          'X-Rate-Limit-Limit': self.limits.limit,
          'X-Rate-Limit-Remaining': (self.limits.remaining > 0) ? --self.limits.remaining : self.limits.remaining,
          'X-Rate-Limit-Reset': self.limits.reset
        }
      };
      var body = 'hello';
      callback(null, response, body);
    };
  });

  it('requests 10', function (done) {
    this.timeout(15000);
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

describe('Normalize headers', function () {

  it('should find alternate headers', function () {
    var testData = {
      headers: {
        'X-Rate-Limit-Limit': 60,
        'X-Rate-Limit-Remaining': 50,
        'X-Rate-Limit-Reset': 40,
        'X-RateLimit-Limit': 60,
        'X-RateLimit-Remaining': 50,
        'X-RateLimit-Reset': 40
      }
    };
    var xRate = new Xrate(function(){});
    var headersLowercased = xRate.lowercaseKeys(testData.headers);
    assert.equal(xRate.getKeyNormalized('x-rate-limit-limit', headersLowercased), 60);
    assert.equal(xRate.getKeyNormalized('x-ratelimit-limit', headersLowercased), 60);
    assert.equal(xRate.getKeyNormalized('x-rate-limit-remaining', headersLowercased), 50);
    assert.equal(xRate.getKeyNormalized('x-ratelimit-remaining', headersLowercased), 50);
    assert.equal(xRate.getKeyNormalized('x-rate-limit-reset', headersLowercased), 40);
    assert.equal(xRate.getKeyNormalized('x-ratelimit-reset', headersLowercased), 40);
  });

});
