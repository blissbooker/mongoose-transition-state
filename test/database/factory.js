var Factory = require('factory-girl');
exports.create = function (model) {
  var c = 1;
  Factory.define('model', model, {
    name: function () {
      return 'johndoe ' + c++;
    }
  });

  return Factory;
};

