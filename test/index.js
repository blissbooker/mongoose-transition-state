/*jshint -W030 */

var Lab = require('lab');
var Lib = require('../');
var Factory = require('./database/factory');
var Db = require('./database');
var Mongoose = Db.Mongoose;

var lab = exports.lab = Lab.script();

var internals = {};
internals.count = 1;

internals.test = function (options) {

  lab.before(function (done) {

    options.defaultState = 'a';
    var schema = new Mongoose.Schema({ name: String });
    schema.plugin(Lib, options);

    this.name = 'model_' + internals.count++;
    this.model = Mongoose.model(this.name, schema);
    this.factory = Factory.create(this.name, this.model);
    return done();
  });

  lab.test('transitions to valid state', function (done) {

    var self = this;
    this.factory.create(this.name, function (err, model) {

      self.model.findOne(model._id, function (err, model) {

        model.state = 'b';
        model.save(function (err, model) {

          Lab.expect(err).to.not.exist;
          Lab.expect(model.state).to.equal('b');
          return done();
        });
      });
    });
  });

  lab.test('fails to set not valid transition', function (done) {

    var self = this;
    this.factory.create(this.name, function (err, model) {

      self.model.findOne(model._id, function (err, model) {

        model.state = 'z';
        model.save(function (err) {
          Lab.expect(err).to.exist;
          return done();
        });
      });
    });
  });

  lab.test('transitions to same state', function (done) {

    var self = this;
    this.factory.create(this.name, function (err, model) {

      var state = model.state;
      self.model.findOne(model._id, function (err, model) {

        model.state = state;
        model.save(function (err) {

          Lab.expect(err).to.not.exist;
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
    delete this.name;
    return done();
  });
};

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
  lab.experiment('no confict', function () {

    lab.before(function (done) {

      var schema = new Mongoose.Schema({ name: String });
      schema.plugin(function (schema) {

        schema.pre('init', function (next) {

          this.__original = {
            other: true
          };
          return next();
        });

        schema.pre('save', function (next) {

          this.__original = {
            other: true
          };
          return next();
        });
      });

      schema.plugin(Lib, { transitions: { 'default': 'b' }});

      this.name = 'model_' + internals.count++;
      this.model = Mongoose.model(this.name, schema);
      this.factory = Factory.create(this.name, this.model);
      return done();
    });

    lab.test('with defined state', function (done) {

      var self = this;
      this.factory.create(this.name, { state: 'myown'}, function (err, model) {

        self.model.findOne(model._id, function (err, model) {

          Lab.expect(model.state).to.equal('myown');
          return done();
        });
      });
    });

    lab.experiment('with __original plugins', function () {

      lab.test('pre init hook', function (done) {

        this.factory.create(this.name, function (err, model) {

          Lab.expect(model.__original.other).to.equal(true);
          return done();
        });
      });

      lab.test('pre save hook', function (done) {

        var self = this;
        this.factory.create(this.name, function (err, model) {

          self.model.findOne(model._id, function (err, model) {

            Lab.expect(model.__original.other).to.equal(true);
            return done();
          });
        });
      });
    });
  });

  lab.experiment('falls back to default state', function () {

    lab.before(function (done) {

      var schema = new Mongoose.Schema({ name: String });
      schema.plugin(Lib, { transitions: { 'default': 'b' }});

      this.name = 'model_' + internals.count++;
      this.model = Mongoose.model(this.name, schema);
      this.factory = Factory.create(this.name, this.model);
      return done();
    });

    lab.test('on fetch', function (done) {

      var self = this;
      this.factory.create(this.name, function (err, model) {

        var attributes = { name: 'name', state: '' };
        self.model.findOneAndUpdate(model._id, attributes, function () {

          self.model.findOne(model._id, function (err, model) {

            Lab.expect(model.state).to.equal('default');
            return done();
          });
        });
      });
    });

    lab.test('on creation', function (done) {

      this.factory.create(this.name, function (err, model) {

        Lab.expect(model.state).to.equal('default');
        return done();
      });
    });
  });

  lab.experiment('with transitions object', function () {

    internals.test({ transitions: { 'a': 'b' }});
  });

  lab.experiment('with transitions array', function () {

    internals.test({ transitions: { 'a': ['b', 'c'] }});
  });

  lab.experiment('with transitions function', function () {

    internals.test({
      transitions: function (original, current, callback) {

        if (current === 'error') {
          return callback(new Error('error'));
        }

        return callback(null, original === 'a' && current === 'b');
      }
    });

    lab.test('propagates error', function (done) {

      this.factory.create(this.name, function (err, model) {

        this.model.findOne(model._id, function (err, model) {

          model.state = 'error';
          model.save(function (err) {

            Lab.expect(err).exist;
            return done();
          });
        });
      });
    });
  });

  lab.experiment('with existing collection', function () {

    lab.beforeEach(function (done) {

      var schema = new Mongoose.Schema({ name: String });
      schema.plugin(Lib, { transitions: { 'default': 'a' } });

      this.name = 'model_' + internals.count++;
      this.model = Mongoose.model(this.name, schema);
      this.model.collection.insert({ name: 'a' }, done);
    });

    lab.test('uses default test', function (done) {
      this.model.findOne(model._id, function (err, model) {

          Lab.expect(err).to.not.exist;
          Lab.expect(model.state, 'default');
          return done();
        });
    });

    lab.afterEach(function (done) {

      delete model;
      delete name;
      return done();
    });
  });
});
