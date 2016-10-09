process.env.NODE_ENV = 'TESTING';

var app = require('../lib');
var should = require('should');
var request = require('superagent');
var baseUrl;

describe('Application', function () {
  before(function (callback) {
    this.timeout(10000);
    app.start(function () {
      baseUrl = 'localhost:' + app.port;
      return callback();
    });
  });
  after(function (callback) {
    this.timeout(10000);
    baseUrl = null;
    app.stop(callback);
  });

  it('should expose port it is listening on', function () {
    should.exist(app.port);
  });

  it('should default to listening on port 3000', function () {
    app.port.should.equal(3000);
  });

  it('should open http server on port 3000', function (done) {
    request
      .get(baseUrl)
      .end(function (err, res) {
        should.not.exist(err);
        should.exist(res);
        return done();
      });
  });

  it('should have a health endpoint', function (done) {
    request
      .get(baseUrl + '/healthz')
      .end(function (err, res) {
        should.not.exist(err);
        should.exist(res);
        var body = res.body;
        should.exist(body.message);
        body.message.should.equal('OK');
        // TODO: Add test for queue health
        // should.exist(body.queue);
        // body.queue.should.equal('HEALTHY');
        return done();
      });
  });
});
