var Mongoose = require('mongoose');

exports.Mongoose = Mongoose;
exports.clean = function (done) {
    var name;
    var models = Mongoose.modelNames() || [];

    (function _clean(index) {
        name = models[index];

        if (index >= models.length - 1) {
            return done();
        }

        Mongoose.model(name).remove({ }, function (err) {
            if (err) {
                return done(err);
            }

            return _clean(index + 1);
        });
    }(0));
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

