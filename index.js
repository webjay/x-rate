'use strict';

module.exports = Xrate;

function Xrate (fn, callback) {
  if (typeof fn !== 'function' || typeof callback !== 'function') {
    throw('Missing function');
  }
  this.fn = fn;
  this.callback = callback;
  this.setLimits();
  this.queue = [];
  this.queueChecker = setInterval(this.queueCheck.bind(this), 1000);
}

Xrate.prototype.getMethod = function () {
  return this.request.bind(this);
};

Xrate.prototype.queueCheck = function () {
  if (this.queue.length === 0) {
    clearInterval(this.queueChecker);
    clearTimeout(this.resetChecker);
    this.callback();
    return;
  }
  this.createResetCheck();
  if (this.queue.length > 0 && this.limits.remaining > 0) {
    for (var i = 0; i < this.limits.remaining; i++) {
      this.request.apply(this, this.queue.shift());
    }
  }
};

Xrate.prototype.createResetCheck = function () {
  if (this.resetChecker === undefined && this.limits.reset > 0) {
    this.resetChecker = setTimeout(this.resetRemaining.bind(this), this.limits.reset);
  }
};

Xrate.prototype.resetRemaining = function () {
  if (this.limits.remaining <= 0) {
    this.limits.remaining = 1;
  }
  delete this.resetChecker;
};

Xrate.prototype.request = function () {
  if (this.limits.remaining === 0) {
    this.queue.push(arguments);
    return;
  }
  var args = Array.prototype.slice.call(arguments, 0, -1);
  var callback = Array.prototype.slice.call(arguments, -1);
  var next = this.next.bind(this, callback[0]);
  this.fn.apply(this.fn, args.concat(next));
};

Xrate.prototype.next = function (callback, err, res, body) {
  this.setLimits(res.headers);
  callback(err, res, body);
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

Xrate.prototype.setLimits = function (headers) {
  var headersLowercased = (headers) ? this.lowercaseKeys(headers) : {};
  this.limits = {
    limit: this.intOrNull(headersLowercased['x-rate-limit-limit']),
    remaining: this.intOrNull(headersLowercased['x-rate-limit-remaining']),
    reset: this.intOrNull(headersLowercased['x-rate-limit-reset']),
  };
};
