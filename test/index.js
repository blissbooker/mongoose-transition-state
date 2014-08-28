/*jshint -W030 */

var Lab = require('lab');
var Lib = require('../');
var Factory = require('./database/factory');
var Db = require('./database');
var Mongoose = Db.Mongoose;

var lab = exports.lab = Lab.script();
lab.experiment('plugin', function () {
  lab.before(function (done) {
    Db.connect(done);
  });
  lab.experiment('fails when', function () {
    lab.test('options are undefined', function (done) {
      Lab.expect(function() {
        var schema = new Mongoose.Schema({ name: String });
        schema.plugin(Lib);
      }).to.throw('options must be provided');
      return done();
    });
    lab.test('options are null', function (done) {
      Lab.expect(function() {
        var schema = new Mongoose.Schema({ name: String });
        schema.plugin(Lib, null);
      }).to.throw('options must be provided');
      return done();
    });
    lab.test('options.transitions are undefined', function (done) {
      Lab.expect(function() {
        var schema = new Mongoose.Schema({ name: String });
        schema.plugin(Lib, {});
      }).to.throw('options.transitions must be provided');
      return done();
    });
    lab.test('options.transitions are null', function (done) {
      Lab.expect(function() {
        var schema = new Mongoose.Schema({ name: String });
        schema.plugin(Lib, {});
      }).to.throw('options.transitions must be provided');
      return done();
    });
  });
  lab.experiment('with transitions array', function () {
    lab.before(function (done) {
      var schema = new Mongoose.Schema({ name: String });
      schema.plugin(Lib, { transitions: [{ 'default': 'b' }]});

      this.model = Mongoose.model('Model', schema);
      this.factory = Factory.create(this.model);

      return done();
    });
    lab.test('transitions to valid state', function (done) {
      this.factory.create('model', function (err, model) {
        this.model.findOne(model._id, function (err, model) {
          model.state = 'b';
          model.save(function (err) {
            Lab.expect(err).to.not.exist;
            return done();
          });
        });
      });
    });
    lab.test('fails to set not valid transition', function (done) {
      this.factory.create('model', function (err, model) {
        this.model.findOne(model._id, function (err, model) {
          model.state = 'c';
          model.save(function (err) {
            Lab.expect(err).to.exist;
            return done();
          });
        });
      });
    });
    lab.afterEach(function (done) {
      Db.clean(done);
    });
    lab.after(function (done) {
      delete this.factory;
      delete this.model;
      return done();
    });
  });
});
