'use strict';

module.exports = Xrate;

function Xrate (fn, callback) {
  if (typeof fn !== 'function') {
    throw('Missing function');
  }
  this.fn = fn;
  this.callback = callback || function(){};
  this.setLimits();
  this.queue = [];
  this.requesting = 0;
  this.queueChecker = setInterval(this.queueCheck.bind(this), 1000);
}

Xrate.prototype.getMethod = function () {
  return this.request.bind(this);
};

Xrate.prototype.queueCheck = function () {
  if (this.queue.length === 0 && this.requesting === 0) {
    clearInterval(this.queueChecker);
    clearTimeout(this.resetChecker);
    this.callback();
    return;
  }
  this.createResetCheck();
  if (this.queue.length > 0 && this.limits.remaining > 0) {
    for (var i = 0; i < this.limits.remaining && i < this.queue.length; i++) {
      this.request.apply(this, this.queue.shift());
    }
  }
};

Xrate.prototype.createResetCheck = function () {
  if (this.resetChecker === undefined && this.limits.reset > 0) {
    this.resetChecker = setTimeout(this.resetRemaining.bind(this), this.limits.reset * 1000);
  }
};

Xrate.prototype.resetRemaining = function () {
  if (this.limits.remaining <= 0) {
    this.limits.remaining = 1;
  }
  clearTimeout(this.resetChecker);
  delete this.resetChecker;
};

Xrate.prototype.request = function () {
  if (this.limits.remaining === 0) {
    this.queue.push(arguments);
    return;
  }
  this.requesting++;
  var args = Array.prototype.slice.call(arguments, 0, -1);
  var callback = Array.prototype.slice.call(arguments, -1);
  var next = this.next.bind(this, callback[0], arguments);
  this.fn.apply(this.fn, args.concat(next));
};

Xrate.prototype.next = function (callback, args, err, response, body) {
  this.setLimits(response.headers);
  if (!err && response.statusCode < 200 || response.statusCode >= 300) {
    err = new Error('Received a non 2xx status code: ' + response.statusCode);
    err.statusCode = response.statusCode;
  }
  callback(err, response, body);
  this.requesting--;
};

Xrate.prototype.intOrNull = function (val) {
  return (val !== undefined) ? parseInt(val, 10) : null;
};

Xrate.prototype.lowercaseKeys = function (obj) {
  var lowercased = {};
  var keys = Object.keys(obj);
  var n = keys.length;
  while (n--) {
    lowercased[keys[n].toLowerCase()] = obj[keys[n]];
  }
  return lowercased;
};

Xrate.prototype.getKeyNormalized = function (key, obj) {
  if (obj[key] === undefined) {
    var keyAlternate = key.replace('rate-limit', 'ratelimit');
    return obj[keyAlternate];
  }
  return obj[key];
};

Xrate.prototype.setLimits = function (headers) {
  var headersLowercased = (headers) ? this.lowercaseKeys(headers) : {};
  this.limits = {
    limit: this.intOrNull(this.getKeyNormalized('x-rate-limit-limit', headersLowercased)),
    remaining: this.intOrNull(this.getKeyNormalized('x-rate-limit-remaining', headersLowercased)),
    reset: this.intOrNull(this.getKeyNormalized('x-rate-limit-reset', headersLowercased)),
  };
};
