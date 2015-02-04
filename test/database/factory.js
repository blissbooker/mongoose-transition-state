var Factory = require('factory-girl');

exports.create = function (name, model) {

    var c = 1;
    Factory.define(name, model, {
        name: function () {
            return 'johndoe ' + c++;
        }
    });

    return Factory;
};
