process.env.NODE_ENV = 'TESTING';

var app = require('../lib');
var should = require('should');
var async = require('async');

var mock = require('./fixtures/mock');
var examples = require('./fixtures/examples');

describe('Snapshot Requests', function () {
  before(function (callback) {
    this.timeout(10000);
    async.parallel([
      async.apply(app.start),
      async.apply(mock.start)
    ], callback);
  });
  after(function (callback) {
    this.timeout(10000);
    async.parallel([
      async.apply(app.stop),
      async.apply(mock.stop)
    ], callback);
  });

  describe('Successful', function () {
    this.timeout(20000);
    it('should process valid incoming request', function (done) {
      var test = examples.success.xkcd;
      mock.waitForResponse(function (err, data) {
        should.not.exist(err);
        should.exist(data);
        should.exist(data.id);
        data.id.should.equal(test.id);
        data.status.should.equal('SUCCESSFUL');
        data.host.should.equal(test.host);
        data.path.should.equal(test.path);
        data.requestedUrl.should.equal(test.requestedUrl);
        should.exist(data.originalImage);
        should.exist(data.thumbnailImage);
        return done();
      });
      mock.enqueue(test);
    });

    it('should process 5 valid incoming requests', function (done) {
      this.timeout(60000);
      var test = examples.success.xkcd;
      var testArray = examples.success.xkcdArray;
      var respEmitter = new mock.ResponseEmitter();
      var count = 0;
      function checkCount () {
        count += 1;
        if (count === 5) {
          respEmitter.close();
        }
      }
      respEmitter.on('error', function (err) {
        done(err);
      });
      respEmitter.on('response', function (data) {
        should.exist(data);
        should.exist(data.id);
        console.log(data);
        data.status.should.equal('SUCCESSFUL');
        data.host.should.equal(test.host);
        data.path.should.equal(test.path);
        data.requestedUrl.should.equal(test.requestedUrl);
        should.exist(data.originalImage);
        should.exist(data.thumbnailImage);
        checkCount();
      });
      respEmitter.once('close', function () {
        done();
      });
      for (var i = 0; i < 5; i++) {
        mock.enqueue(testArray[i]);
      }
    });
  });

  describe('Failure', function () {
    this.timeout(20000);
    it('should handle invalid incoming request', function (done) {
      var test = examples.failure.xkcd;
      mock.waitForResponse(function (err, data) {
        console.log('err:', err);
        console.log('data:', data);
        should.not.exist(err);
        should.exist(data);
        should.exist(data.id);
        data.id.should.equal(test.id);
        data.status.should.equal('FAILED');
        data.host.should.equal(test.host);
        data.path.should.equal(test.path);
        data.requestedUrl.should.equal(test.requestedUrl);
        should.not.exist(data.originalImage);
        should.not.exist(data.thumbnailImage);
        return done();
      });
      mock.enqueue(test);
    });
  });
});
