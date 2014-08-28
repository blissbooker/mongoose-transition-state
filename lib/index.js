var internals = {};
internals.validateOptions = function (options) {
  if (!options) {
    throw new Error('options must be provided');
  }

  if (!options.transitions) {
    throw new Error('options.transitions must be provided');
  }
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
  for (var i = 0; i < transitions.length; i++) {
    var transition = transitions[i];
    if (transition[original] === current) {
      return next();
    }
  }
  return next(internals.createError(original, current));
};

internals.normalizeOptions = function (options) {
  if (!options.defaultState) {
    options.defaultState = 'created';
  }

  if (options.transitions instanceof Function) {
    return options;
  }

  if (!(options.transitions instanceof Array)) {
    options.transitions = [options.transitions];
  }

  return options;
};

exports = module.exports = function (schema, options) {
  internals.validateOptions(options);

  schema.pre('init', function (next, data) {
    this.__original = data;
    return next();
  });

  schema.pre('save', function (next) {
    options = internals.normalizeOptions(options);

    if (this.isNew || !this.__original) {
      this.state = options.defaultState;
      return next();
    }

    var current = this.state;
    var original = this.__original.state;
    var transitions = options.transitions;
    if (transitions instanceof Function) {
      return internals.externalValidation(original, current, transitions, next);
    }

    return internals.internalValidation(original, current, transitions, next);
  });

  schema.add({ state: String });
};
