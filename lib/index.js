var internals = {};
internals.enforce = function (options) {
  if (!options) {
    throw new Error('options must be provided');
  }

  if (!options.transitions) {
    throw new Error('options.transitions must be provided');
  }
};

exports = module.exports = function (schema, options) {
  internals.enforce(options);

  schema.add({ state: String });
  schema.pre('init', function (next, data) {
    this.__original = data;
    return next();
  });

  schema.pre('save', function (next) {
    if (this.isNew || !this.__original) {
      this.state = options.defaultState || 'default';
      return next();
    }

    var current = this.state;
    var original = this.__original.state;
    var msg = ['Invalid state transition from', original, 'to', current];
    if (options.transitions instanceof Function) {
      return options.transitions(original, current,
        function (err, isValid) {
          if (err) {
            return next(err);
          }

          if (!isValid) {
            return next(new Error(msg.join(' ')));
          }

          return next();
        }
      );
    }

    if (!(options.transitions instanceof Array)) {
      options.transitions = [options.transitions];
    }

    for (var i = 0; i < options.transitions.length; i++) {
      var transition = options.transitions[i];
      if (transition[original] === current) {
        return next();
      }
    }

    return next(new Error(msg.join(' ')));
  });
};
