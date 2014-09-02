var internals = {};
internals.validateOptions = function (options) {
  if (!options) {
    throw new Error('options must be provided');
  }

  if (!options.transitions) {
    throw new Error('options.transitions must be provided');
  }
};

internals.normalizeOptions = function (options) {
  if (!options.defaultState) {
    options.defaultState = 'default';
  }

  if (options.transitions instanceof Function) {
    return options;
  }

  return options;
};

internals.createError = function (original, current) {
  var msg = ['Invalid state transition from', original, 'to', current];
  return new Error(msg.join(' '));
};

internals.externalValidation = function (original, current, fn, next) {
  fn(original, current, function (err, isValid) {
    if (err) {
      return next(err);
    }

    if (!isValid) {
      return next(internals.createError(original, current));
    }

    return next();
  });
};

internals.internalValidation = function (original, current, transitions, next) {
  if (!(transitions instanceof Array)) {
    transitions = [transitions];
  }

  var some = transitions.some(function (t) {
    return t === current;
  });

  return next(some ? null: internals.createError(original, current));
};

exports = module.exports = function (schema, options) {
  internals.validateOptions(options);
  options = internals.normalizeOptions(options);

  schema.pre('init', function (next, data) {
    if (!this.__original) {
      this.__original = {};
    }

    if (!data.state) {
      data.state = options.defaultState;
    }

    this.__original.state = data.state;
    return next();
  });

  schema.pre('save', function (next) {
    if (this.isNew) {
      if (!this.state) {
        this.state = options.defaultState;
      }

      if (!this.__original) {
        this.__original = {};
      }

      this.__original.state = this.state;
      return next();
    }

    var current = this.state;
    var original = this.__original.state;

    if (original === current) {
      return next();
    }

    var transitions = options.transitions;
    if (transitions instanceof Function) {
      return internals.externalValidation(original, current, transitions, next);
    }

    return internals.internalValidation(original, current,
     transitions[original], next);
  });

  schema.add({ state: String });
};
