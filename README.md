# x-rate

[![Circle CI](https://circleci.com/gh/webjay/x-rate.svg?style=svg&circle-token=f9c9886e0636b3904efb6f26eaaf11b7d18a4797)](https://circleci.com/gh/webjay/x-rate)

## Install

    npm install x-rate --save

## About

Use [request](https://www.npmjs.com/package/request) and adhere to X-Rate-Limit headers.

    X-Rate-Limit-Limit: 60
    X-Rate-Limit-Remaining: 25
    X-Rate-Limit-Reset: 8

## Use

    var request = require('request');
    var Xrate = require('x-rate');
    var xRate = new Xrate(request, queueDoneCallback);
    var req = xRate.getMethod();
    for (var i = 0; i < 10; i++) {
      req({ url: 'localhost' }, function (err, res, body) {
      });
    }
