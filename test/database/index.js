var Mongoose = require('mongoose');
var Cleaner = require('database-cleaner');
var cleaner = new Cleaner('mongodb');

exports.Mongoose = Mongoose;
exports.clean = function (done) {
    if (Mongoose.connections && Mongoose.connections[0]) {
        return cleaner.clean(Mongoose.connections[0].db, done);
    }
    return done();
};

exports.connect = function (done) {
    var url = 'mongodb://localhost/mongoose-transition-state';
    Mongoose.connect(url, function (err) {
        if (err && !(/trying to open unclosed connection/i).test(err.message)) {
            return done(err);
        }
          return done();
    });
};

