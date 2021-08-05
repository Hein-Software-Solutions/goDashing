(function() {
  var Batman,
    __slice = [].slice;

  Batman = function() {
    var mixins;
    mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args), t = typeof result;
      return t == "object" || t == "function" ? result || child : child;
    })(Batman.Object, mixins, function(){});
  };

  Batman.version = '0.14.1';

  Batman.config = {
    pathPrefix: '/',
    viewPrefix: 'views',
    fetchRemoteViews: true,
    usePushState: false,
    minificationErrors: true
  };

  (Batman.container = (function() {
    return this;
  })()).Batman = Batman;

  if (typeof define === 'function') {
    define('batman', [], function() {
      return Batman;
    });
  }

  Batman.exportHelpers = function(onto) {
    var k, _i, _len, _ref;
    _ref = ['mixin', 'extend', 'unmixin', 'redirect', 'typeOf', 'redirect', 'setImmediate', 'clearImmediate'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      onto["$" + k] = Batman[k];
    }
    return onto;
  };

  Batman.exportGlobals = function() {
    return Batman.exportHelpers(Batman.container);
  };

}).call(this);

(function() {
  var _Batman;

  Batman._Batman = _Batman = (function() {

    function _Batman(object) {
      this.object = object;
    }

    _Batman.prototype.check = function(object) {
      if (object !== this.object) {
        object._batman = new Batman._Batman(object);
        return false;
      }
      return true;
    };

    _Batman.prototype.get = function(key) {
      var reduction, results;
      results = this.getAll(key);
      switch (results.length) {
        case 0:
          return void 0;
        case 1:
          return results[0];
        default:
          reduction = results[0].concat != null ? function(a, b) {
            return a.concat(b);
          } : results[0].merge != null ? function(a, b) {
            return a.merge(b);
          } : results.every(function(x) {
            return typeof x === 'object';
          }) ? (results.unshift({}), function(a, b) {
            return Batman.extend(a, b);
          }) : void 0;
          if (reduction) {
            return results.reduceRight(reduction);
          } else {
            return results;
          }
      }
    };

    _Batman.prototype.getFirst = function(key) {
      var results;
      results = this.getAll(key);
      return results[0];
    };

    _Batman.prototype.getAll = function(keyOrGetter) {
      var getter, results, val;
      if (typeof keyOrGetter === 'function') {
        getter = keyOrGetter;
      } else {
        getter = function(ancestor) {
          var _ref;
          return (_ref = ancestor._batman) != null ? _ref[keyOrGetter] : void 0;
        };
      }
      results = this.ancestors(getter);
      if (val = getter(this.object)) {
        results.unshift(val);
      }
      return results;
    };

    _Batman.prototype.ancestors = function(getter) {
      var ancestor, results, val, _i, _len, _ref;
      this._allAncestors || (this._allAncestors = this.allAncestors());
      if (getter) {
        results = [];
        _ref = this._allAncestors;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ancestor = _ref[_i];
          val = getter(ancestor);
          if (val != null) {
            results.push(val);
          }
        }
        return results;
      } else {
        return this._allAncestors;
      }
    };

    _Batman.prototype.allAncestors = function() {
      var isClass, parent, proto, results, _ref, _ref1;
      results = [];
      isClass = !!this.object.prototype;
      parent = isClass ? (_ref = this.object.__super__) != null ? _ref.constructor : void 0 : (proto = Object.getPrototypeOf(this.object)) === this.object ? this.object.constructor.__super__ : proto;
      if (parent != null) {
        if ((_ref1 = parent._batman) != null) {
          _ref1.check(parent);
        }
        results.push(parent);
        if (parent._batman != null) {
          results = results.concat(parent._batman.allAncestors());
        }
      }
      return results;
    };

    _Batman.prototype.set = function(key, value) {
      return this[key] = value;
    };

    return _Batman;

  })();

}).call(this);

(function() {
  var chr, _encodedChars, _encodedCharsPattern, _entityMap, _implementImmediates, _objectToString, _unsafeChars, _unsafeCharsPattern,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Batman.typeOf = function(object) {
    if (typeof object === 'undefined') {
      return "Undefined";
    }
    return _objectToString.call(object).slice(8, -1);
  };

  _objectToString = Object.prototype.toString;

  Batman.extend = function() {
    var key, object, objects, to, value, _i, _len;
    to = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      for (key in object) {
        value = object[key];
        to[key] = value;
      }
    }
    return to;
  };

  Batman.mixin = function() {
    var hasSet, key, mixin, mixins, to, value, _i, _len;
    to = arguments[0], mixins = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    hasSet = typeof to.set === 'function';
    for (_i = 0, _len = mixins.length; _i < _len; _i++) {
      mixin = mixins[_i];
      if (Batman.typeOf(mixin) !== 'Object') {
        continue;
      }
      for (key in mixin) {
        if (!__hasProp.call(mixin, key)) continue;
        value = mixin[key];
        if (key === 'initialize' || key === 'uninitialize' || key === 'prototype') {
          continue;
        }
        if (hasSet) {
          to.set(key, value);
        } else if (to.nodeName != null) {
          Batman.data(to, key, value);
        } else {
          to[key] = value;
        }
      }
      if (typeof mixin.initialize === 'function') {
        mixin.initialize.call(to);
      }
    }
    return to;
  };

  Batman.unmixin = function() {
    var from, key, mixin, mixins, _i, _len;
    from = arguments[0], mixins = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = mixins.length; _i < _len; _i++) {
      mixin = mixins[_i];
      for (key in mixin) {
        if (key === 'initialize' || key === 'uninitialize') {
          continue;
        }
        delete from[key];
      }
      if (typeof mixin.uninitialize === 'function') {
        mixin.uninitialize.call(from);
      }
    }
    return from;
  };

  Batman._functionName = Batman.functionName = function(f) {
    var _ref;
    if (f.__name__) {
      return f.__name__;
    }
    if (f.name) {
      return f.name;
    }
    return (_ref = f.toString().match(/\W*function\s+([\w\$]+)\(/)) != null ? _ref[1] : void 0;
  };

  Batman._isChildOf = Batman.isChildOf = function(parentNode, childNode) {
    var node;
    node = childNode.parentNode;
    while (node) {
      if (node === parentNode) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  _implementImmediates = function(container) {
    var canUsePostMessage, count, functions, getHandle, handler, prefix, tasks;
    canUsePostMessage = function() {
      var async, oldMessage;
      if (!container.postMessage) {
        return false;
      }
      async = true;
      oldMessage = container.onmessage;
      container.onmessage = function() {
        return async = false;
      };
      container.postMessage("", "*");
      container.onmessage = oldMessage;
      return async;
    };
    tasks = new Batman.SimpleHash;
    count = 0;
    getHandle = function() {
      return "go" + (++count);
    };
    if (container.setImmediate && container.clearImmediate) {
      Batman.setImmediate = container.setImmediate;
      return Batman.clearImmediate = container.clearImmediate;
    } else if (canUsePostMessage()) {
      prefix = 'com.batman.';
      functions = new Batman.SimpleHash;
      handler = function(e) {
        var handle, _base;
        if (!~e.data.search(prefix)) {
          return;
        }
        handle = e.data.substring(prefix.length);
        return typeof (_base = tasks.unset(handle)) === "function" ? _base() : void 0;
      };
      if (container.addEventListener) {
        container.addEventListener('message', handler, false);
      } else {
        container.attachEvent('onmessage', handler);
      }
      Batman.setImmediate = function(f) {
        var handle;
        tasks.set(handle = getHandle(), f);
        container.postMessage(prefix + handle, "*");
        return handle;
      };
      return Batman.clearImmediate = function(handle) {
        return tasks.unset(handle);
      };
    } else if (typeof document !== 'undefined' && __indexOf.call(document.createElement("script"), "onreadystatechange") >= 0) {
      Batman.setImmediate = function(f) {
        var handle, script;
        handle = getHandle();
        script = document.createElement("script");
        script.onreadystatechange = function() {
          var _base;
          if (typeof (_base = tasks.get(handle)) === "function") {
            _base();
          }
          script.onreadystatechange = null;
          script.parentNode.removeChild(script);
          return script = null;
        };
        document.documentElement.appendChild(script);
        return handle;
      };
      return Batman.clearImmediate = function(handle) {
        return tasks.unset(handle);
      };
    } else if (typeof process !== "undefined" && process !== null ? process.nextTick : void 0) {
      functions = {};
      Batman.setImmediate = function(f) {
        var handle;
        handle = getHandle();
        functions[handle] = f;
        process.nextTick(function() {
          if (typeof functions[handle] === "function") {
            functions[handle]();
          }
          return delete functions[handle];
        });
        return handle;
      };
      return Batman.clearImmediate = function(handle) {
        return delete functions[handle];
      };
    } else {
      Batman.setImmediate = function(f) {
        return setTimeout(f, 0);
      };
      return Batman.clearImmediate = function(handle) {
        return clearTimeout(handle);
      };
    }
  };

  Batman.setImmediate = function() {
    _implementImmediates(Batman.container);
    return Batman.setImmediate.apply(this, arguments);
  };

  Batman.clearImmediate = function() {
    _implementImmediates(Batman.container);
    return Batman.clearImmediate.apply(this, arguments);
  };

  Batman.forEach = function(container, iterator, ctx) {
    var e, i, k, v, _i, _len, _results, _results1;
    if (container.forEach) {
      return container.forEach(iterator, ctx);
    } else if (container.indexOf) {
      _results = [];
      for (i = _i = 0, _len = container.length; _i < _len; i = ++_i) {
        e = container[i];
        _results.push(iterator.call(ctx, e, i, container));
      }
      return _results;
    } else {
      _results1 = [];
      for (k in container) {
        v = container[k];
        _results1.push(iterator.call(ctx, k, v, container));
      }
      return _results1;
    }
  };

  Batman.objectHasKey = function(object, key) {
    if (typeof object.hasKey === 'function') {
      return object.hasKey(key);
    } else {
      return key in object;
    }
  };

  Batman.contains = function(container, item) {
    if (container.indexOf) {
      return __indexOf.call(container, item) >= 0;
    } else if (typeof container.has === 'function') {
      return container.has(item);
    } else {
      return Batman.objectHasKey(container, item);
    }
  };

  Batman.get = function(base, key) {
    if (typeof base.get === 'function') {
      return base.get(key);
    } else {
      return Batman.Property.forBaseAndKey(base, key).getValue();
    }
  };

  Batman.getPath = function(base, segments) {
    var segment, _i, _len;
    for (_i = 0, _len = segments.length; _i < _len; _i++) {
      segment = segments[_i];
      if (base != null) {
        base = Batman.get(base, segment);
        if (base == null) {
          return base;
        }
      } else {
        return void 0;
      }
    }
    return base;
  };

  _entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&#34;",
    "'": "&#39;"
  };

  _unsafeChars = [];

  _encodedChars = [];

  for (chr in _entityMap) {
    _unsafeChars.push(chr);
    _encodedChars.push(_entityMap[chr]);
  }

  _unsafeCharsPattern = new RegExp("[" + (_unsafeChars.join('')) + "]", "g");

  _encodedCharsPattern = new RegExp("(" + (_encodedChars.join('|')) + ")", "g");

  Batman.escapeHTML = (function() {
    return function(s) {
      return ("" + s).replace(_unsafeCharsPattern, function(c) {
        return _entityMap[c];
      });
    };
  })();

  Batman.unescapeHTML = (function() {
    return function(s) {
      var node;
      if (s == null) {
        return;
      }
      node = Batman._unescapeHTMLNode || (Batman._unescapeHTMLNode = document.createElement('DIV'));
      node.innerHTML = s;
      if (node.innerText != null) {
        return node.innerText;
      } else {
        return node.textContent;
      }
    };
  })();

  Batman.translate = function(x, values) {
    if (values == null) {
      values = {};
    }
    return Batman.helpers.interpolate(Batman.get(Batman.translate.messages, x), values);
  };

  Batman.translate.messages = {};

  Batman.t = function() {
    return Batman.translate.apply(Batman, arguments);
  };

  Batman.redirect = function(url) {
    var _ref;
    return (_ref = Batman.navigator) != null ? _ref.redirect(url) : void 0;
  };

  Batman.initializeObject = function(object) {
    if (object._batman != null) {
      return object._batman.check(object);
    } else {
      return object._batman = new Batman._Batman(object);
    }
  };

}).call(this);

(function() {
  var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Batman.Inflector = (function() {

    Inflector.prototype.plural = function(regex, replacement) {
      return this._plural.unshift([regex, replacement]);
    };

    Inflector.prototype.singular = function(regex, replacement) {
      return this._singular.unshift([regex, replacement]);
    };

    Inflector.prototype.human = function(regex, replacement) {
      return this._human.unshift([regex, replacement]);
    };

    Inflector.prototype.uncountable = function() {
      var strings;
      strings = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._uncountable = this._uncountable.concat(strings.map(function(x) {
        return new RegExp("" + x + "$", 'i');
      }));
    };

    Inflector.prototype.irregular = function(singular, plural) {
      if (singular.charAt(0) === plural.charAt(0)) {
        this.plural(new RegExp("(" + (singular.charAt(0)) + ")" + (singular.slice(1)) + "$", "i"), "$1" + plural.slice(1));
        this.plural(new RegExp("(" + (singular.charAt(0)) + ")" + (plural.slice(1)) + "$", "i"), "$1" + plural.slice(1));
        return this.singular(new RegExp("(" + (plural.charAt(0)) + ")" + (plural.slice(1)) + "$", "i"), "$1" + singular.slice(1));
      } else {
        this.plural(new RegExp("" + singular + "$", 'i'), plural);
        this.plural(new RegExp("" + plural + "$", 'i'), plural);
        return this.singular(new RegExp("" + plural + "$", 'i'), singular);
      }
    };

    function Inflector() {
      this._plural = [];
      this._singular = [];
      this._uncountable = [];
      this._human = [];
    }

    Inflector.prototype.ordinalize = function(number) {
      var absNumber, _ref;
      absNumber = Math.abs(parseInt(number));
      if (_ref = absNumber % 100, __indexOf.call([11, 12, 13], _ref) >= 0) {
        return number + "th";
      } else {
        switch (absNumber % 10) {
          case 1:
            return number + "st";
          case 2:
            return number + "nd";
          case 3:
            return number + "rd";
          default:
            return number + "th";
        }
      }
    };

    Inflector.prototype.pluralize = function(word) {
      var regex, replace_string, uncountableRegex, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      _ref = this._uncountable;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        uncountableRegex = _ref[_i];
        if (uncountableRegex.test(word)) {
          return word;
        }
      }
      _ref1 = this._plural;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        _ref2 = _ref1[_j], regex = _ref2[0], replace_string = _ref2[1];
        if (regex.test(word)) {
          return word.replace(regex, replace_string);
        }
      }
      return word;
    };

    Inflector.prototype.singularize = function(word) {
      var regex, replace_string, uncountableRegex, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      _ref = this._uncountable;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        uncountableRegex = _ref[_i];
        if (uncountableRegex.test(word)) {
          return word;
        }
      }
      _ref1 = this._singular;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        _ref2 = _ref1[_j], regex = _ref2[0], replace_string = _ref2[1];
        if (regex.test(word)) {
          return word.replace(regex, replace_string);
        }
      }
      return word;
    };

    Inflector.prototype.humanize = function(word) {
      var regex, replace_string, _i, _len, _ref, _ref1;
      _ref = this._human;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], regex = _ref1[0], replace_string = _ref1[1];
        if (regex.test(word)) {
          return word.replace(regex, replace_string);
        }
      }
      return word;
    };

    return Inflector;

  })();

}).call(this);

(function() {
  var Inflector, camelize_rx, capitalize_rx, humanize_rx1, humanize_rx2, humanize_rx3, underscore_rx1, underscore_rx2;

  camelize_rx = /(?:^|_|\-)(.)/g;

  capitalize_rx = /(^|\s)([a-z])/g;

  underscore_rx1 = /([A-Z]+)([A-Z][a-z])/g;

  underscore_rx2 = /([a-z\d])([A-Z])/g;

  humanize_rx1 = /_id$/;

  humanize_rx2 = /_|-/g;

  humanize_rx3 = /^\w/g;

  Batman.helpers = {
    ordinalize: function() {
      return Batman.helpers.inflector.ordinalize.apply(Batman.helpers.inflector, arguments);
    },
    singularize: function() {
      return Batman.helpers.inflector.singularize.apply(Batman.helpers.inflector, arguments);
    },
    pluralize: function(count, singular, plural, includeCount) {
      var result;
      if (includeCount == null) {
        includeCount = true;
      }
      if (arguments.length < 2) {
        return Batman.helpers.inflector.pluralize(count);
      } else {
        result = +count === 1 ? singular : plural || Batman.helpers.inflector.pluralize(singular);
        if (includeCount) {
          result = ("" + (count || 0) + " ") + result;
        }
        return result;
      }
    },
    camelize: function(string, firstLetterLower) {
      string = string.replace(camelize_rx, function(str, p1) {
        return p1.toUpperCase();
      });
      if (firstLetterLower) {
        return string.substr(0, 1).toLowerCase() + string.substr(1);
      } else {
        return string;
      }
    },
    underscore: function(string) {
      return string.replace(underscore_rx1, '$1_$2').replace(underscore_rx2, '$1_$2').replace('-', '_').toLowerCase();
    },
    capitalize: function(string) {
      return string.replace(capitalize_rx, function(m, p1, p2) {
        return p1 + p2.toUpperCase();
      });
    },
    trim: function(string) {
      if (string) {
        return string.trim();
      } else {
        return "";
      }
    },
    interpolate: function(stringOrObject, keys) {
      var key, string, value;
      if (typeof stringOrObject === 'object') {
        string = stringOrObject[keys.count];
        if (!string) {
          string = stringOrObject['other'];
        }
      } else {
        string = stringOrObject;
      }
      for (key in keys) {
        value = keys[key];
        string = string.replace(new RegExp("%\\{" + key + "\\}", "g"), value);
      }
      return string;
    },
    humanize: function(string) {
      string = Batman.helpers.underscore(string);
      string = Batman.helpers.inflector.humanize(string);
      return string.replace(humanize_rx1, '').replace(humanize_rx2, ' ').replace(humanize_rx3, function(match) {
        return match.toUpperCase();
      });
    }
  };

  Inflector = new Batman.Inflector;

  Batman.helpers.inflector = Inflector;

  Inflector.plural(/$/, 's');

  Inflector.plural(/s$/i, 's');

  Inflector.plural(/(ax|test)is$/i, '$1es');

  Inflector.plural(/(octop|vir)us$/i, '$1i');

  Inflector.plural(/(octop|vir)i$/i, '$1i');

  Inflector.plural(/(alias|status)$/i, '$1es');

  Inflector.plural(/(bu)s$/i, '$1ses');

  Inflector.plural(/(buffal|tomat)o$/i, '$1oes');

  Inflector.plural(/([ti])um$/i, '$1a');

  Inflector.plural(/([ti])a$/i, '$1a');

  Inflector.plural(/sis$/i, 'ses');

  Inflector.plural(/(?:([^f])fe|([lr])f)$/i, '$1$2ves');

  Inflector.plural(/(hive)$/i, '$1s');

  Inflector.plural(/([^aeiouy]|qu)y$/i, '$1ies');

  Inflector.plural(/(x|ch|ss|sh)$/i, '$1es');

  Inflector.plural(/(matr|vert|ind)(?:ix|ex)$/i, '$1ices');

  Inflector.plural(/([m|l])ouse$/i, '$1ice');

  Inflector.plural(/([m|l])ice$/i, '$1ice');

  Inflector.plural(/^(ox)$/i, '$1en');

  Inflector.plural(/^(oxen)$/i, '$1');

  Inflector.plural(/(quiz)$/i, '$1zes');

  Inflector.singular(/s$/i, '');

  Inflector.singular(/(n)ews$/i, '$1ews');

  Inflector.singular(/([ti])a$/i, '$1um');

  Inflector.singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1$2sis');

  Inflector.singular(/(^analy)ses$/i, '$1sis');

  Inflector.singular(/([^f])ves$/i, '$1fe');

  Inflector.singular(/(hive)s$/i, '$1');

  Inflector.singular(/(tive)s$/i, '$1');

  Inflector.singular(/([lr])ves$/i, '$1f');

  Inflector.singular(/([^aeiouy]|qu)ies$/i, '$1y');

  Inflector.singular(/(s)eries$/i, '$1eries');

  Inflector.singular(/(m)ovies$/i, '$1ovie');

  Inflector.singular(/(x|ch|ss|sh)es$/i, '$1');

  Inflector.singular(/([m|l])ice$/i, '$1ouse');

  Inflector.singular(/(bus)es$/i, '$1');

  Inflector.singular(/(o)es$/i, '$1');

  Inflector.singular(/(shoe)s$/i, '$1');

  Inflector.singular(/(cris|ax|test)es$/i, '$1is');

  Inflector.singular(/(octop|vir)i$/i, '$1us');

  Inflector.singular(/(alias|status)es$/i, '$1');

  Inflector.singular(/^(ox)en/i, '$1');

  Inflector.singular(/(vert|ind)ices$/i, '$1ex');

  Inflector.singular(/(matr)ices$/i, '$1ix');

  Inflector.singular(/(quiz)zes$/i, '$1');

  Inflector.singular(/(database)s$/i, '$1');

  Inflector.irregular('person', 'people');

  Inflector.irregular('man', 'men');

  Inflector.irregular('child', 'children');

  Inflector.irregular('sex', 'sexes');

  Inflector.irregular('move', 'moves');

  Inflector.irregular('cow', 'kine');

  Inflector.irregular('zombie', 'zombies');

  Inflector.uncountable('equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'jeans');

}).call(this);

(function() {
  var developer;

  Batman.developer = {
    suppressed: false,
    DevelopmentError: (function() {
      var DevelopmentError;
      DevelopmentError = function(message) {
        this.message = message;
        return this.name = "DevelopmentError";
      };
      DevelopmentError.prototype = Error.prototype;
      return DevelopmentError;
    })(),
    _ie_console: function(f, args) {
      var arg, _i, _len, _results;
      if (args.length !== 1) {
        if (typeof console !== "undefined" && console !== null) {
          console[f]("..." + f + " of " + args.length + " items...");
        }
      }
      _results = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        _results.push(typeof console !== "undefined" && console !== null ? console[f](arg) : void 0);
      }
      return _results;
    },
    suppress: function(f) {
      developer.suppressed = true;
      if (f) {
        f();
        return developer.suppressed = false;
      }
    },
    unsuppress: function() {
      return developer.suppressed = false;
    },
    log: function() {
      if (developer.suppressed || !((typeof console !== "undefined" && console !== null ? console.log : void 0) != null)) {
        return;
      }
      if (console.log.apply) {
        return console.log.apply(console, arguments);
      } else {
        return developer._ie_console("log", arguments);
      }
    },
    warn: function() {
      if (developer.suppressed || !((typeof console !== "undefined" && console !== null ? console.warn : void 0) != null)) {
        return;
      }
      if (console.warn.apply) {
        return console.warn.apply(console, arguments);
      } else {
        return developer._ie_console("warn", arguments);
      }
    },
    error: function(message) {
      throw new developer.DevelopmentError(message);
    },
    assert: function(result, message) {
      if (!result) {
        return developer.error(message);
      }
    },
    "do": function(f) {
      if (!developer.suppressed) {
        return f();
      }
    },
    addFilters: function() {
      return Batman.extend(Batman.Filters, {
        log: function(value, key) {
          if (typeof console !== "undefined" && console !== null) {
            if (typeof console.log === "function") {
              console.log(arguments);
            }
          }
          return value;
        },
        logStack: function(value) {
          if (typeof console !== "undefined" && console !== null) {
            if (typeof console.log === "function") {
              console.log(developer.currentFilterStack);
            }
          }
          return value;
        }
      });
    },
    deprecated: function(deprecatedName, upgradeString) {
      return Batman.developer.warn("" + deprecatedName + " has been deprecated.", upgradeString || '');
    }
  };

  developer = Batman.developer;

  Batman.developer.assert((function() {}).bind, "Error! Batman needs Function.bind to work! Please shim it using something like es5-shim or augmentjs!");

}).call(this);

(function() {

  Batman.Event = (function() {

    Event.forBaseAndKey = function(base, key) {
      if (base.isEventEmitter) {
        return base.event(key);
      } else {
        return new Batman.Event(base, key);
      }
    };

    function Event(base, key) {
      this.base = base;
      this.key = key;
      this._preventCount = 0;
    }

    Event.prototype.isEvent = true;

    Event.prototype.isEqual = function(other) {
      return this.constructor === other.constructor && this.base === other.base && this.key === other.key;
    };

    Event.prototype.hashKey = function() {
      var key;
      this.hashKey = function() {
        return key;
      };
      return key = "<Batman.Event base: " + (Batman.Hash.prototype.hashKeyFor(this.base)) + ", key: \"" + (Batman.Hash.prototype.hashKeyFor(this.key)) + "\">";
    };

    Event.prototype.addHandler = function(handler) {
      this.handlers || (this.handlers = []);
      if (this.handlers.indexOf(handler) === -1) {
        this.handlers.push(handler);
      }
      if (this.oneShot) {
        this.autofireHandler(handler);
      }
      return this;
    };

    Event.prototype.removeHandler = function(handler) {
      var index;
      if (this.handlers && (index = this.handlers.indexOf(handler)) !== -1) {
        this.handlers.splice(index, 1);
      }
      return this;
    };

    Event.prototype.eachHandler = function(iterator) {
      var ancestor, key, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results;
      if ((_ref = this.handlers) != null) {
        _ref.slice().forEach(iterator);
      }
      if ((_ref1 = this.base) != null ? _ref1.isEventEmitter : void 0) {
        key = this.key;
        _ref3 = (_ref2 = this.base._batman) != null ? _ref2.ancestors() : void 0;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          ancestor = _ref3[_i];
          if (ancestor.isEventEmitter && ((_ref4 = ancestor._batman) != null ? (_ref5 = _ref4.events) != null ? _ref5.hasOwnProperty(key) : void 0 : void 0)) {
            _results.push((_ref6 = ancestor.event(key, false)) != null ? (_ref7 = _ref6.handlers) != null ? _ref7.slice().forEach(iterator) : void 0 : void 0);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Event.prototype.clearHandlers = function() {
      return this.handlers = void 0;
    };

    Event.prototype.handlerContext = function() {
      return this.base;
    };

    Event.prototype.prevent = function() {
      return ++this._preventCount;
    };

    Event.prototype.allow = function() {
      if (this._preventCount) {
        --this._preventCount;
      }
      return this._preventCount;
    };

    Event.prototype.isPrevented = function() {
      return this._preventCount > 0;
    };

    Event.prototype.autofireHandler = function(handler) {
      if (this._oneShotFired && (this._oneShotArgs != null)) {
        return handler.apply(this.handlerContext(), this._oneShotArgs);
      }
    };

    Event.prototype.resetOneShot = function() {
      this._oneShotFired = false;
      return this._oneShotArgs = null;
    };

    Event.prototype.fire = function() {
      return this.fireWithContext(this.handlerContext(), arguments);
    };

    Event.prototype.fireWithContext = function(context, args) {
      if (this.isPrevented() || this._oneShotFired) {
        return false;
      }
      if (this.oneShot) {
        this._oneShotFired = true;
        this._oneShotArgs = args;
      }
      return this.eachHandler(function(handler) {
        return handler.apply(context, args);
      });
    };

    Event.prototype.allowAndFire = function() {
      return this.allowAndFireWithContext(this.handlerContext, arguments);
    };

    Event.prototype.allowAndFireWithContext = function(context, args) {
      this.allow();
      return this.fireWithContext(context, args);
    };

    return Event;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PropertyEvent = (function(_super) {

    __extends(PropertyEvent, _super);

    function PropertyEvent() {
      return PropertyEvent.__super__.constructor.apply(this, arguments);
    }

    PropertyEvent.prototype.eachHandler = function(iterator) {
      return this.base.eachObserver(iterator);
    };

    PropertyEvent.prototype.handlerContext = function() {
      return this.base.base;
    };

    return PropertyEvent;

  })(Batman.Event);

}).call(this);

(function() {
  var __slice = [].slice;

  Batman.EventEmitter = {
    isEventEmitter: true,
    hasEvent: function(key) {
      var _ref, _ref1;
      return (_ref = this._batman) != null ? typeof _ref.get === "function" ? (_ref1 = _ref.get('events')) != null ? _ref1.hasOwnProperty(key) : void 0 : void 0 : void 0;
    },
    event: function(key, createEvent) {
      var ancestor, eventClass, events, existingEvent, newEvent, _base, _i, _len, _ref, _ref1, _ref2, _ref3;
      if (createEvent == null) {
        createEvent = true;
      }
      Batman.initializeObject(this);
      eventClass = this.eventClass || Batman.Event;
      if ((_ref = this._batman.events) != null ? _ref.hasOwnProperty(key) : void 0) {
        return existingEvent = this._batman.events[key];
      } else {
        _ref1 = this._batman.ancestors();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          ancestor = _ref1[_i];
          existingEvent = (_ref2 = ancestor._batman) != null ? (_ref3 = _ref2.events) != null ? _ref3[key] : void 0 : void 0;
          if (existingEvent) {
            break;
          }
        }
        if (createEvent || (existingEvent != null ? existingEvent.oneShot : void 0)) {
          events = (_base = this._batman).events || (_base.events = {});
          newEvent = events[key] = new eventClass(this, key);
          newEvent.oneShot = existingEvent != null ? existingEvent.oneShot : void 0;
          return newEvent;
        } else {
          return existingEvent;
        }
      }
    },
    on: function() {
      var handler, key, keys, _i, _j, _len, _results;
      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), handler = arguments[_i++];
      _results = [];
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        _results.push(this.event(key).addHandler(handler));
      }
      return _results;
    },
    once: function(key, handler) {
      var event, handlerWrapper;
      event = this.event(key);
      handlerWrapper = function() {
        handler.apply(this, arguments);
        return event.removeHandler(handlerWrapper);
      };
      return event.addHandler(handlerWrapper);
    },
    registerAsMutableSource: function() {
      return Batman.Property.registerSource(this);
    },
    mutation: function(wrappedFunction) {
      return function() {
        var result, _ref;
        result = wrappedFunction.apply(this, arguments);
        if ((_ref = this.event('change', false)) != null) {
          _ref.fire(this, this);
        }
        return result;
      };
    },
    prevent: function(key) {
      this.event(key).prevent();
      return this;
    },
    allow: function(key) {
      this.event(key).allow();
      return this;
    },
    isPrevented: function(key) {
      var _ref;
      return (_ref = this.event(key, false)) != null ? _ref.isPrevented() : void 0;
    },
    fire: function() {
      var args, key, _ref;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return (_ref = this.event(key, false)) != null ? _ref.fireWithContext(this, args) : void 0;
    },
    allowAndFire: function() {
      var args, key, _ref;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return (_ref = this.event(key, false)) != null ? _ref.allowAndFireWithContext(this, args) : void 0;
    }
  };

}).call(this);

(function() {
  var __slice = [].slice;

  Batman.Enumerable = {
    isEnumerable: true,
    map: function(f, ctx) {
      var result;
      if (ctx == null) {
        ctx = Batman.container;
      }
      result = [];
      this.forEach(function() {
        return result.push(f.apply(ctx, arguments));
      });
      return result;
    },
    mapToProperty: function(key) {
      var result;
      result = [];
      this.forEach(function(item) {
        return result.push(item.get(key));
      });
      return result;
    },
    every: function(f, ctx) {
      var result;
      if (ctx == null) {
        ctx = Batman.container;
      }
      result = true;
      this.forEach(function() {
        return result = result && f.apply(ctx, arguments);
      });
      return result;
    },
    some: function(f, ctx) {
      var result;
      if (ctx == null) {
        ctx = Batman.container;
      }
      result = false;
      this.forEach(function() {
        return result = result || f.apply(ctx, arguments);
      });
      return result;
    },
    reduce: function(f, accumulator) {
      var count, initialValuePassed, self;
      count = 0;
      self = this;
      if (accumulator != null) {
        initialValuePassed = true;
      } else {
        initialValuePassed = false;
      }
      this.forEach(function() {
        if (!initialValuePassed) {
          accumulator = arguments[0];
          initialValuePassed = true;
          return;
        }
        return accumulator = f.apply(null, [accumulator].concat(__slice.call(arguments), [count], [self]));
      });
      return accumulator;
    },
    filter: function(f) {
      var result, wrap;
      result = new this.constructor;
      if (result.add) {
        wrap = function(result, element) {
          if (f(element)) {
            result.add(element);
          }
          return result;
        };
      } else if (result.set) {
        wrap = function(result, key, value) {
          if (f(key, value)) {
            result.set(key, value);
          }
          return result;
        };
      } else {
        if (!result.push) {
          result = [];
        }
        wrap = function(result, element) {
          if (f(element)) {
            result.push(element);
          }
          return result;
        };
      }
      return this.reduce(wrap, result);
    },
    inGroupsOf: function(groupSize) {
      var current, i, result;
      result = [];
      current = false;
      i = 0;
      this.forEach(function(element) {
        if (i++ % groupSize === 0) {
          current = [];
          result.push(current);
        }
        return current.push(element);
      });
      return result;
    }
  };

}).call(this);

(function() {
  var _objectToString,
    __slice = [].slice;

  _objectToString = Object.prototype.toString;

  Batman.SimpleHash = (function() {

    function SimpleHash(obj) {
      this._storage = {};
      this.length = 0;
      if (obj != null) {
        this.update(obj);
      }
    }

    Batman.extend(SimpleHash.prototype, Batman.Enumerable);

    SimpleHash.prototype.hasKey = function(key) {
      var pair, pairs, _i, _len;
      if (this.objectKey(key)) {
        if (!this._objectStorage) {
          return false;
        }
        if (pairs = this._objectStorage[this.hashKeyFor(key)]) {
          for (_i = 0, _len = pairs.length; _i < _len; _i++) {
            pair = pairs[_i];
            if (this.equality(pair[0], key)) {
              return true;
            }
          }
        }
        return false;
      } else {
        key = this.prefixedKey(key);
        return this._storage.hasOwnProperty(key);
      }
    };

    SimpleHash.prototype.get = function(key) {
      var pair, pairs, _i, _len;
      if (this.objectKey(key)) {
        if (!this._objectStorage) {
          return void 0;
        }
        if (pairs = this._objectStorage[this.hashKeyFor(key)]) {
          for (_i = 0, _len = pairs.length; _i < _len; _i++) {
            pair = pairs[_i];
            if (this.equality(pair[0], key)) {
              return pair[1];
            }
          }
        }
      } else {
        return this._storage[this.prefixedKey(key)];
      }
    };

    SimpleHash.prototype.set = function(key, val) {
      var pair, pairs, _base, _i, _len, _name;
      if (this.objectKey(key)) {
        this._objectStorage || (this._objectStorage = {});
        pairs = (_base = this._objectStorage)[_name = this.hashKeyFor(key)] || (_base[_name] = []);
        for (_i = 0, _len = pairs.length; _i < _len; _i++) {
          pair = pairs[_i];
          if (this.equality(pair[0], key)) {
            return pair[1] = val;
          }
        }
        this.length++;
        pairs.push([key, val]);
        return val;
      } else {
        key = this.prefixedKey(key);
        if (this._storage[key] == null) {
          this.length++;
        }
        return this._storage[key] = val;
      }
    };

    SimpleHash.prototype.unset = function(key) {
      var hashKey, index, obj, pair, pairs, val, value, _i, _len, _ref;
      if (this.objectKey(key)) {
        if (!this._objectStorage) {
          return void 0;
        }
        hashKey = this.hashKeyFor(key);
        if (pairs = this._objectStorage[hashKey]) {
          for (index = _i = 0, _len = pairs.length; _i < _len; index = ++_i) {
            _ref = pairs[index], obj = _ref[0], value = _ref[1];
            if (this.equality(obj, key)) {
              pair = pairs.splice(index, 1);
              if (!pairs.length) {
                delete this._objectStorage[hashKey];
              }
              this.length--;
              return pair[0][1];
            }
          }
        }
      } else {
        key = this.prefixedKey(key);
        val = this._storage[key];
        if (this._storage[key] != null) {
          this.length--;
          delete this._storage[key];
        }
        return val;
      }
    };

    SimpleHash.prototype.getOrSet = function(key, valueFunction) {
      var currentValue;
      currentValue = this.get(key);
      if (!currentValue) {
        currentValue = valueFunction();
        this.set(key, currentValue);
      }
      return currentValue;
    };

    SimpleHash.prototype.prefixedKey = function(key) {
      return "_" + key;
    };

    SimpleHash.prototype.unprefixedKey = function(key) {
      return key.slice(1);
    };

    SimpleHash.prototype.hashKeyFor = function(obj) {
      var hashKey, typeString;
      if (hashKey = obj != null ? typeof obj.hashKey === "function" ? obj.hashKey() : void 0 : void 0) {
        return hashKey;
      } else {
        typeString = _objectToString.call(obj);
        if (typeString === "[object Array]") {
          return typeString;
        } else {
          return obj;
        }
      }
    };

    SimpleHash.prototype.equality = function(lhs, rhs) {
      if (lhs === rhs) {
        return true;
      }
      if (lhs !== lhs && rhs !== rhs) {
        return true;
      }
      if ((lhs != null ? typeof lhs.isEqual === "function" ? lhs.isEqual(rhs) : void 0 : void 0) && (rhs != null ? typeof rhs.isEqual === "function" ? rhs.isEqual(lhs) : void 0 : void 0)) {
        return true;
      }
      return false;
    };

    SimpleHash.prototype.objectKey = function(key) {
      return typeof key !== 'string';
    };

    SimpleHash.prototype.forEach = function(iterator, ctx) {
      var key, obj, results, value, values, _i, _len, _ref, _ref1, _ref2, _ref3;
      results = [];
      if (this._objectStorage) {
        _ref = this._objectStorage;
        for (key in _ref) {
          values = _ref[key];
          _ref1 = values.slice();
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            _ref2 = _ref1[_i], obj = _ref2[0], value = _ref2[1];
            results.push(iterator.call(ctx, obj, value, this));
          }
        }
      }
      _ref3 = this._storage;
      for (key in _ref3) {
        value = _ref3[key];
        results.push(iterator.call(ctx, this.unprefixedKey(key), value, this));
      }
      return results;
    };

    SimpleHash.prototype.keys = function() {
      var result;
      result = [];
      Batman.SimpleHash.prototype.forEach.call(this, function(key) {
        return result.push(key);
      });
      return result;
    };

    SimpleHash.prototype.toArray = SimpleHash.prototype.keys;

    SimpleHash.prototype.clear = function() {
      this._storage = {};
      delete this._objectStorage;
      return this.length = 0;
    };

    SimpleHash.prototype.isEmpty = function() {
      return this.length === 0;
    };

    SimpleHash.prototype.merge = function() {
      var hash, merged, others, _i, _len;
      others = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      merged = new this.constructor;
      others.unshift(this);
      for (_i = 0, _len = others.length; _i < _len; _i++) {
        hash = others[_i];
        hash.forEach(function(obj, value) {
          return merged.set(obj, value);
        });
      }
      return merged;
    };

    SimpleHash.prototype.update = function(object) {
      var k, v, _results;
      _results = [];
      for (k in object) {
        v = object[k];
        _results.push(this.set(k, v));
      }
      return _results;
    };

    SimpleHash.prototype.replace = function(object) {
      var _this = this;
      this.forEach(function(key, value) {
        if (!(key in object)) {
          return _this.unset(key);
        }
      });
      return this.update(object);
    };

    SimpleHash.prototype.toObject = function() {
      var key, obj, pair, value, _ref, _ref1;
      obj = {};
      _ref = this._storage;
      for (key in _ref) {
        value = _ref[key];
        obj[this.unprefixedKey(key)] = value;
      }
      if (this._objectStorage) {
        _ref1 = this._objectStorage;
        for (key in _ref1) {
          pair = _ref1[key];
          obj[key] = pair[0][1];
        }
      }
      return obj;
    };

    SimpleHash.prototype.toJSON = SimpleHash.prototype.toObject;

    return SimpleHash;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.AssociationCurator = (function(_super) {

    __extends(AssociationCurator, _super);

    AssociationCurator.availableAssociations = ['belongsTo', 'hasOne', 'hasMany'];

    function AssociationCurator(model) {
      this.model = model;
      AssociationCurator.__super__.constructor.call(this);
      this._byTypeStorage = new Batman.SimpleHash;
    }

    AssociationCurator.prototype.add = function(association) {
      var associationTypeSet;
      this.set(association.label, association);
      if (!(associationTypeSet = this._byTypeStorage.get(association.associationType))) {
        associationTypeSet = new Batman.SimpleSet;
        this._byTypeStorage.set(association.associationType, associationTypeSet);
      }
      return associationTypeSet.add(association);
    };

    AssociationCurator.prototype.getByType = function(type) {
      return this._byTypeStorage.get(type);
    };

    AssociationCurator.prototype.getByLabel = function(label) {
      return this.get(label);
    };

    AssociationCurator.prototype.reset = function() {
      this.forEach(function(label, association) {
        return association.reset();
      });
      return true;
    };

    AssociationCurator.prototype.merge = function() {
      var others, result;
      others = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      result = AssociationCurator.__super__.merge.apply(this, arguments);
      result._byTypeStorage = this._byTypeStorage.merge(others.map(function(other) {
        return other._byTypeStorage;
      }));
      return result;
    };

    AssociationCurator.prototype._markDirtyAttribute = function(key, oldValue) {
      var _ref;
      if ((_ref = this.lifecycle.get('state')) !== 'loading' && _ref !== 'creating' && _ref !== 'saving' && _ref !== 'saved') {
        if (this.lifecycle.startTransition('set')) {
          return this.dirtyKeys.set(key, oldValue);
        } else {
          throw new Batman.StateMachine.InvalidTransitionError("Can't set while in state " + (this.lifecycle.get('state')));
        }
      }
    };

    return AssociationCurator;

  })(Batman.SimpleHash);

}).call(this);

(function() {
  var __slice = [].slice;

  Batman.SimpleSet = (function() {

    function SimpleSet() {
      var item, itemsToAdd;
      this._storage = [];
      this.length = 0;
      itemsToAdd = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = arguments.length; _i < _len; _i++) {
          item = arguments[_i];
          if (item != null) {
            _results.push(item);
          }
        }
        return _results;
      }).apply(this, arguments);
      if (itemsToAdd.length > 0) {
        this.add.apply(this, itemsToAdd);
      }
    }

    Batman.extend(SimpleSet.prototype, Batman.Enumerable);

    SimpleSet.prototype.has = function(item) {
      return !!(~this._indexOfItem(item));
    };

    SimpleSet.prototype.add = function() {
      var addedItems, item, items, _i, _len;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      addedItems = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (!(!~this._indexOfItem(item))) {
          continue;
        }
        this._storage.push(item);
        addedItems.push(item);
      }
      this.length = this._storage.length;
      if (this.fire && addedItems.length !== 0) {
        this.fire('change', this, this);
        this.fire.apply(this, ['itemsWereAdded'].concat(__slice.call(addedItems)));
      }
      return addedItems;
    };

    SimpleSet.prototype.remove = function() {
      var index, item, items, removedItems, _i, _len;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      removedItems = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (!(~(index = this._indexOfItem(item)))) {
          continue;
        }
        this._storage.splice(index, 1);
        removedItems.push(item);
      }
      this.length = this._storage.length;
      if (this.fire && removedItems.length !== 0) {
        this.fire('change', this, this);
        this.fire.apply(this, ['itemsWereRemoved'].concat(__slice.call(removedItems)));
      }
      return removedItems;
    };

    SimpleSet.prototype.find = function(f) {
      var item, _i, _len, _ref;
      _ref = this._storage;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (f(item)) {
          return item;
        }
      }
    };

    SimpleSet.prototype.forEach = function(iterator, ctx) {
      var key, _i, _len, _ref, _results;
      _ref = this._storage;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(iterator.call(ctx, key, null, this));
      }
      return _results;
    };

    SimpleSet.prototype.isEmpty = function() {
      return this.length === 0;
    };

    SimpleSet.prototype.clear = function() {
      var items;
      items = this._storage;
      this._storage = [];
      this.length = 0;
      if (this.fire && items.length !== 0) {
        this.fire('change', this, this);
        this.fire.apply(this, ['itemsWereRemoved'].concat(__slice.call(items)));
      }
      return items;
    };

    SimpleSet.prototype.replace = function(other) {
      try {
        if (typeof this.prevent === "function") {
          this.prevent('change');
        }
        this.clear();
        return this.add.apply(this, other.toArray());
      } finally {
        if (typeof this.allowAndFire === "function") {
          this.allowAndFire('change', this, this);
        }
      }
    };

    SimpleSet.prototype.toArray = function() {
      return this._storage.slice();
    };

    SimpleSet.prototype.merge = function() {
      var merged, others, set, _i, _len;
      others = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      merged = new this.constructor;
      others.unshift(this);
      for (_i = 0, _len = others.length; _i < _len; _i++) {
        set = others[_i];
        set.forEach(function(v) {
          return merged.add(v);
        });
      }
      return merged;
    };

    SimpleSet.prototype.indexedBy = function(key) {
      this._indexes || (this._indexes = new Batman.SimpleHash);
      return this._indexes.get(key) || this._indexes.set(key, new Batman.SetIndex(this, key));
    };

    SimpleSet.prototype.indexedByUnique = function(key) {
      this._uniqueIndexes || (this._uniqueIndexes = new Batman.SimpleHash);
      return this._uniqueIndexes.get(key) || this._uniqueIndexes.set(key, new Batman.UniqueSetIndex(this, key));
    };

    SimpleSet.prototype.sortedBy = function(key, order) {
      var sortsForKey;
      if (order == null) {
        order = "asc";
      }
      order = order.toLowerCase() === "desc" ? "desc" : "asc";
      this._sorts || (this._sorts = new Batman.SimpleHash);
      sortsForKey = this._sorts.get(key) || this._sorts.set(key, new Batman.Object);
      return sortsForKey.get(order) || sortsForKey.set(order, new Batman.SetSort(this, key, order));
    };

    SimpleSet.prototype.equality = Batman.SimpleHash.prototype.equality;

    SimpleSet.prototype._indexOfItem = function(givenItem) {
      var index, item, _i, _len, _ref;
      _ref = this._storage;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        item = _ref[index];
        if (this.equality(givenItem, item)) {
          return index;
        }
      }
      return -1;
    };

    return SimpleSet;

  })();

}).call(this);

(function() {
  var SOURCE_TRACKER_STACK, SOURCE_TRACKER_STACK_VALID,
    __slice = [].slice;

  SOURCE_TRACKER_STACK = [];

  SOURCE_TRACKER_STACK_VALID = true;

  Batman.Property = (function() {

    Batman.mixin(Property.prototype, Batman.EventEmitter);

    Property._sourceTrackerStack = SOURCE_TRACKER_STACK;

    Property._sourceTrackerStackValid = SOURCE_TRACKER_STACK_VALID;

    Property.defaultAccessor = {
      get: function(key) {
        return this[key];
      },
      set: function(key, val) {
        return this[key] = val;
      },
      unset: function(key) {
        var x;
        x = this[key];
        delete this[key];
        return x;
      },
      cache: false
    };

    Property.defaultAccessorForBase = function(base) {
      var _ref;
      return ((_ref = base._batman) != null ? _ref.getFirst('defaultAccessor') : void 0) || Batman.Property.defaultAccessor;
    };

    Property.accessorForBaseAndKey = function(base, key) {
      var accessor, ancestor, _bm, _i, _len, _ref, _ref1, _ref2, _ref3;
      if ((_bm = base._batman) != null) {
        accessor = (_ref = _bm.keyAccessors) != null ? _ref.get(key) : void 0;
        if (!accessor) {
          _ref1 = _bm.ancestors();
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            ancestor = _ref1[_i];
            accessor = (_ref2 = ancestor._batman) != null ? (_ref3 = _ref2.keyAccessors) != null ? _ref3.get(key) : void 0 : void 0;
            if (accessor) {
              break;
            }
          }
        }
      }
      return accessor || this.defaultAccessorForBase(base);
    };

    Property.forBaseAndKey = function(base, key) {
      if (base.isObservable) {
        return base.property(key);
      } else {
        return new Batman.Keypath(base, key);
      }
    };

    Property.withoutTracking = function(block) {
      return this.wrapTrackingPrevention(block)();
    };

    Property.wrapTrackingPrevention = function(block) {
      return function() {
        Batman.Property.pushDummySourceTracker();
        try {
          return block.apply(this, arguments);
        } finally {
          Batman.Property.popSourceTracker();
        }
      };
    };

    Property.registerSource = function(obj) {
      var set;
      if (!obj.isEventEmitter) {
        return;
      }
      if (SOURCE_TRACKER_STACK_VALID) {
        set = SOURCE_TRACKER_STACK[SOURCE_TRACKER_STACK.length - 1];
      } else {
        set = [];
        SOURCE_TRACKER_STACK.push(set);
        SOURCE_TRACKER_STACK_VALID = true;
      }
      if (set != null) {
        set.push(obj);
      }
      return void 0;
    };

    Property.pushSourceTracker = function() {
      if (SOURCE_TRACKER_STACK_VALID) {
        return SOURCE_TRACKER_STACK_VALID = false;
      } else {
        return SOURCE_TRACKER_STACK.push([]);
      }
    };

    Property.popSourceTracker = function() {
      if (SOURCE_TRACKER_STACK_VALID) {
        return SOURCE_TRACKER_STACK.pop();
      } else {
        SOURCE_TRACKER_STACK_VALID = true;
        return void 0;
      }
    };

    Property.pushDummySourceTracker = function() {
      if (!SOURCE_TRACKER_STACK_VALID) {
        SOURCE_TRACKER_STACK.push([]);
        SOURCE_TRACKER_STACK_VALID = true;
      }
      return SOURCE_TRACKER_STACK.push(null);
    };

    function Property(base, key) {
      this.base = base;
      this.key = key;
    }

    Property.prototype._isolationCount = 0;

    Property.prototype.cached = false;

    Property.prototype.value = null;

    Property.prototype.sources = null;

    Property.prototype.isProperty = true;

    Property.prototype.isDead = false;

    Property.prototype.eventClass = Batman.PropertyEvent;

    Property.prototype.isEqual = function(other) {
      return this.constructor === other.constructor && this.base === other.base && this.key === other.key;
    };

    Property.prototype.hashKey = function() {
      return this._hashKey || (this._hashKey = "<Batman.Property base: " + (Batman.Hash.prototype.hashKeyFor(this.base)) + ", key: \"" + (Batman.Hash.prototype.hashKeyFor(this.key)) + "\">");
    };

    Property.prototype.event = function(key) {
      var eventClass, _base;
      eventClass = this.eventClass || Batman.Event;
      this.events || (this.events = {});
      (_base = this.events)[key] || (_base[key] = new eventClass(this, key));
      return this.events[key];
    };

    Property.prototype.changeEvent = function() {
      return this._changeEvent || (this._changeEvent = this.event('change'));
    };

    Property.prototype.accessor = function() {
      return this._accessor || (this._accessor = this.constructor.accessorForBaseAndKey(this.base, this.key));
    };

    Property.prototype.eachObserver = function(iterator) {
      var ancestor, handlers, key, object, property, _i, _j, _len, _len1, _ref, _ref1, _ref2, _results;
      key = this.key;
      handlers = (_ref = this.changeEvent().handlers) != null ? _ref.slice() : void 0;
      if (handlers) {
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          object = handlers[_i];
          iterator(object);
        }
      }
      if (this.base.isObservable) {
        _ref1 = this.base._batman.ancestors();
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          ancestor = _ref1[_j];
          if (ancestor.isObservable && ancestor.hasProperty(key)) {
            property = ancestor.property(key);
            handlers = (_ref2 = property.changeEvent().handlers) != null ? _ref2.slice() : void 0;
            if (handlers) {
              _results.push((function() {
                var _k, _len2, _results1;
                _results1 = [];
                for (_k = 0, _len2 = handlers.length; _k < _len2; _k++) {
                  object = handlers[_k];
                  _results1.push(iterator(object));
                }
                return _results1;
              })());
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Property.prototype.observers = function() {
      var results;
      results = [];
      this.eachObserver(function(observer) {
        return results.push(observer);
      });
      return results;
    };

    Property.prototype.hasObservers = function() {
      return this.observers().length > 0;
    };

    Property.prototype.updateSourcesFromTracker = function() {
      var handler, newSources, source, _i, _j, _len, _len1, _ref, _ref1, _results;
      newSources = this.constructor.popSourceTracker();
      handler = this.sourceChangeHandler();
      if (this.sources) {
        _ref = this.sources;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          source = _ref[_i];
          if (source != null) {
            source.event('change').removeHandler(handler);
          }
        }
      }
      this.sources = newSources;
      if (this.sources) {
        _ref1 = this.sources;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          source = _ref1[_j];
          _results.push(source != null ? source.event('change').addHandler(handler) : void 0);
        }
        return _results;
      }
    };

    Property.prototype.getValue = function() {
      this.registerAsMutableSource();
      if (!this.isCached()) {
        this.constructor.pushSourceTracker();
        try {
          this.value = this.valueFromAccessor();
          this.cached = true;
        } finally {
          this.updateSourcesFromTracker();
        }
      }
      return this.value;
    };

    Property.prototype.isCachable = function() {
      var cacheable;
      if (this.isFinal()) {
        return true;
      }
      cacheable = this.accessor().cache;
      if (cacheable != null) {
        return !!cacheable;
      } else {
        return true;
      }
    };

    Property.prototype.isCached = function() {
      return this.isCachable() && this.cached;
    };

    Property.prototype.isFinal = function() {
      return !!this.accessor()['final'];
    };

    Property.prototype.refresh = function() {
      var previousValue, value;
      this.cached = false;
      previousValue = this.value;
      value = this.getValue();
      if (value !== previousValue && !this.isIsolated()) {
        this.fire(value, previousValue);
      }
      if (this.value !== void 0 && this.isFinal()) {
        return this.lockValue();
      }
    };

    Property.prototype.sourceChangeHandler = function() {
      var _this = this;
      this._sourceChangeHandler || (this._sourceChangeHandler = this._handleSourceChange.bind(this));
      Batman.developer["do"](function() {
        return _this._sourceChangeHandler.property = _this;
      });
      return this._sourceChangeHandler;
    };

    Property.prototype._handleSourceChange = function() {
      if (this.isIsolated()) {
        return this._needsRefresh = true;
      } else if (!this.isFinal() && !this.hasObservers()) {
        return this.cached = false;
      } else {
        return this.refresh();
      }
    };

    Property.prototype.valueFromAccessor = function() {
      var _ref;
      return (_ref = this.accessor().get) != null ? _ref.call(this.base, this.key) : void 0;
    };

    Property.prototype.setValue = function(val) {
      var set;
      if (!(set = this.accessor().set)) {
        return;
      }
      return this._changeValue(function() {
        return set.call(this.base, this.key, val);
      });
    };

    Property.prototype.unsetValue = function() {
      var unset;
      if (!(unset = this.accessor().unset)) {
        return;
      }
      return this._changeValue(function() {
        return unset.call(this.base, this.key);
      });
    };

    Property.prototype._changeValue = function(block) {
      var result;
      this.cached = false;
      this.constructor.pushDummySourceTracker();
      try {
        result = block.apply(this);
        this.refresh();
      } finally {
        this.constructor.popSourceTracker();
      }
      if (!(this.isCached() || this.hasObservers())) {
        this.die();
      }
      return result;
    };

    Property.prototype.forget = function(handler) {
      if (handler != null) {
        return this.changeEvent().removeHandler(handler);
      } else {
        return this.changeEvent().clearHandlers();
      }
    };

    Property.prototype.observeAndFire = function(handler) {
      this.observe(handler);
      return handler.call(this.base, this.value, this.value, this.key);
    };

    Property.prototype.observe = function(handler) {
      this.changeEvent().addHandler(handler);
      if (this.sources == null) {
        this.getValue();
      }
      return this;
    };

    Property.prototype.observeOnce = function(originalHandler) {
      var event, handler;
      event = this.changeEvent();
      handler = function() {
        originalHandler.apply(this, arguments);
        return event.removeHandler(handler);
      };
      event.addHandler(handler);
      if (this.sources == null) {
        this.getValue();
      }
      return this;
    };

    Property.prototype._removeHandlers = function() {
      var handler, source, _i, _len, _ref;
      handler = this.sourceChangeHandler();
      if (this.sources) {
        _ref = this.sources;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          source = _ref[_i];
          source.event('change').removeHandler(handler);
        }
      }
      delete this.sources;
      return this.changeEvent().clearHandlers();
    };

    Property.prototype.lockValue = function() {
      this._removeHandlers();
      this.getValue = function() {
        return this.value;
      };
      return this.setValue = this.unsetValue = this.refresh = this.observe = function() {};
    };

    Property.prototype.die = function() {
      var _ref, _ref1;
      this._removeHandlers();
      if ((_ref = this.base._batman) != null) {
        if ((_ref1 = _ref.properties) != null) {
          _ref1.unset(this.key);
        }
      }
      return this.isDead = true;
    };

    Property.prototype.fire = function() {
      var _ref;
      return (_ref = this.changeEvent()).fire.apply(_ref, __slice.call(arguments).concat([this.key]));
    };

    Property.prototype.isolate = function() {
      if (this._isolationCount === 0) {
        this._preIsolationValue = this.getValue();
      }
      return this._isolationCount++;
    };

    Property.prototype.expose = function() {
      if (this._isolationCount === 1) {
        this._isolationCount--;
        if (this._needsRefresh) {
          this.value = this._preIsolationValue;
          this.refresh();
        } else if (this.value !== this._preIsolationValue) {
          this.fire(this.value, this._preIsolationValue);
        }
        return this._preIsolationValue = null;
      } else if (this._isolationCount > 0) {
        return this._isolationCount--;
      }
    };

    Property.prototype.isIsolated = function() {
      return this._isolationCount > 0;
    };

    return Property;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Keypath = (function(_super) {

    __extends(Keypath, _super);

    function Keypath(base, key) {
      if (typeof key === 'string') {
        this.segments = key.split('.');
        this.depth = this.segments.length;
      } else {
        this.segments = [key];
        this.depth = 1;
      }
      Keypath.__super__.constructor.apply(this, arguments);
    }

    Keypath.prototype.isCachable = function() {
      if (this.depth === 1) {
        return Keypath.__super__.isCachable.apply(this, arguments);
      } else {
        return true;
      }
    };

    Keypath.prototype.terminalProperty = function() {
      var base;
      base = Batman.getPath(this.base, this.segments.slice(0, -1));
      if (base == null) {
        return;
      }
      return Batman.Keypath.forBaseAndKey(base, this.segments[this.depth - 1]);
    };

    Keypath.prototype.valueFromAccessor = function() {
      if (this.depth === 1) {
        return Keypath.__super__.valueFromAccessor.apply(this, arguments);
      } else {
        return Batman.getPath(this.base, this.segments);
      }
    };

    Keypath.prototype.setValue = function(val) {
      var _ref;
      if (this.depth === 1) {
        return Keypath.__super__.setValue.apply(this, arguments);
      } else {
        return (_ref = this.terminalProperty()) != null ? _ref.setValue(val) : void 0;
      }
    };

    Keypath.prototype.unsetValue = function() {
      var _ref;
      if (this.depth === 1) {
        return Keypath.__super__.unsetValue.apply(this, arguments);
      } else {
        return (_ref = this.terminalProperty()) != null ? _ref.unsetValue() : void 0;
      }
    };

    return Keypath;

  })(Batman.Property);

}).call(this);

(function() {
  var __slice = [].slice;

  Batman.Observable = {
    isObservable: true,
    hasProperty: function(key) {
      var _ref, _ref1;
      return (_ref = this._batman) != null ? (_ref1 = _ref.properties) != null ? typeof _ref1.hasKey === "function" ? _ref1.hasKey(key) : void 0 : void 0 : void 0;
    },
    property: function(key) {
      var properties, propertyClass, _base;
      Batman.initializeObject(this);
      propertyClass = this.propertyClass || Batman.Keypath;
      properties = (_base = this._batman).properties || (_base.properties = new Batman.SimpleHash);
      return properties.get(key) || properties.set(key, new propertyClass(this, key));
    },
    get: function(key) {
      return this.property(key).getValue();
    },
    set: function(key, val) {
      return this.property(key).setValue(val);
    },
    unset: function(key) {
      return this.property(key).unsetValue();
    },
    getOrSet: Batman.SimpleHash.prototype.getOrSet,
    forget: function(key, observer) {
      var _ref;
      if (key) {
        this.property(key).forget(observer);
      } else {
        if ((_ref = this._batman.properties) != null) {
          _ref.forEach(function(key, property) {
            return property.forget();
          });
        }
      }
      return this;
    },
    observe: function() {
      var args, key, _ref;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      (_ref = this.property(key)).observe.apply(_ref, args);
      return this;
    },
    observeAndFire: function() {
      var args, key, _ref;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      (_ref = this.property(key)).observeAndFire.apply(_ref, args);
      return this;
    },
    observeOnce: function() {
      var args, key, _ref;
      key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      (_ref = this.property(key)).observeOnce.apply(_ref, args);
      return this;
    }
  };

}).call(this);

(function() {

  Batman.DOM = {
    textInputTypes: ['text', 'search', 'tel', 'url', 'email', 'password'],
    scrollIntoView: function(elementID) {
      var _ref;
      return (_ref = document.getElementById(elementID)) != null ? typeof _ref.scrollIntoView === "function" ? _ref.scrollIntoView() : void 0 : void 0;
    },
    partial: function(container, path, context, renderer) {
      var view;
      renderer.prevent('rendered');
      view = new Batman.View({
        source: path,
        context: context
      });
      return view.on('ready', function() {
        Batman.DOM.setInnerHTML(container, '');
        Batman.DOM.appendChild(container, view.get('node'));
        return renderer.allowAndFire('rendered');
      });
    },
    propagateBindingEvent: function(binding, node) {
      var current, parentBinding, parentBindings, _i, _len;
      while ((current = (current || node).parentNode)) {
        parentBindings = Batman._data(current, 'bindings');
        if (parentBindings != null) {
          for (_i = 0, _len = parentBindings.length; _i < _len; _i++) {
            parentBinding = parentBindings[_i];
            if (typeof parentBinding.childBindingAdded === "function") {
              parentBinding.childBindingAdded(binding);
            }
          }
        }
      }
    },
    propagateBindingEvents: function(newNode) {
      var binding, bindings, child, _i, _j, _len, _len1, _ref;
      _ref = newNode.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        Batman.DOM.propagateBindingEvents(child);
      }
      if (bindings = Batman._data(newNode, 'bindings')) {
        for (_j = 0, _len1 = bindings.length; _j < _len1; _j++) {
          binding = bindings[_j];
          Batman.DOM.propagateBindingEvent(binding, newNode);
        }
      }
    },
    trackBinding: function(binding, node) {
      var bindings;
      if (bindings = Batman._data(node, 'bindings')) {
        bindings.push(binding);
      } else {
        Batman._data(node, 'bindings', [binding]);
      }
      Batman.DOM.fire('bindingAdded', binding);
      Batman.DOM.propagateBindingEvent(binding, node);
      return true;
    },
    onParseExit: function(node, callback) {
      var set;
      set = Batman._data(node, 'onParseExit') || Batman._data(node, 'onParseExit', new Batman.SimpleSet);
      if (callback != null) {
        set.add(callback);
      }
      return set;
    },
    forgetParseExit: function(node, callback) {
      return Batman.removeData(node, 'onParseExit', true);
    },
    defineView: function(name, node) {
      var contents;
      contents = node.innerHTML;
      Batman.View.store.set(Batman.Navigator.normalizePath(name), contents);
      return contents;
    },
    setStyleProperty: function(node, property, value, importance) {
      if (node.style.setProperty) {
        return node.style.setProperty(property, value, importance);
      } else {
        return node.style.setAttribute(property, value, importance);
      }
    },
    removeOrDestroyNode: function(node) {
      var view;
      view = Batman._data(node, 'view');
      view || (view = Batman._data(node, 'yielder'));
      if ((view != null) && view.get('cached')) {
        return Batman.DOM.removeNode(node);
      } else {
        return Batman.DOM.destroyNode(node);
      }
    },
    insertBefore: function(parentNode, newNode, referenceNode) {
      if (referenceNode == null) {
        referenceNode = null;
      }
      if (!referenceNode || parentNode.childNodes.length <= 0) {
        return Batman.DOM.appendChild(parentNode, newNode);
      } else {
        Batman.DOM.willInsertNode(newNode);
        parentNode.insertBefore(newNode, referenceNode);
        return Batman.DOM.didInsertNode(newNode);
      }
    },
    valueForNode: function(node, value, escapeValue) {
      var isSetting;
      if (value == null) {
        value = '';
      }
      if (escapeValue == null) {
        escapeValue = true;
      }
      isSetting = arguments.length > 1;
      switch (node.nodeName.toUpperCase()) {
        case 'INPUT':
        case 'TEXTAREA':
          if (isSetting) {
            return node.value = value;
          } else {
            return node.value;
          }
          break;
        case 'SELECT':
          if (isSetting) {
            return node.value = value;
          }
          break;
        default:
          if (isSetting) {
            return Batman.DOM.setInnerHTML(node, escapeValue ? Batman.escapeHTML(value) : value);
          } else {
            return node.innerHTML;
          }
      }
    },
    nodeIsEditable: function(node) {
      var _ref;
      return (_ref = node.nodeName.toUpperCase()) === 'INPUT' || _ref === 'TEXTAREA' || _ref === 'SELECT';
    },
    addEventListener: function(node, eventName, callback) {
      var listeners;
      if (!(listeners = Batman._data(node, 'listeners'))) {
        listeners = Batman._data(node, 'listeners', {});
      }
      if (!listeners[eventName]) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(callback);
      if (Batman.DOM.hasAddEventListener) {
        return node.addEventListener(eventName, callback, false);
      } else {
        return node.attachEvent("on" + eventName, callback);
      }
    },
    removeEventListener: function(node, eventName, callback) {
      var eventListeners, index, listeners;
      if (listeners = Batman._data(node, 'listeners')) {
        if (eventListeners = listeners[eventName]) {
          index = eventListeners.indexOf(callback);
          if (index !== -1) {
            eventListeners.splice(index, 1);
          }
        }
      }
      if (Batman.DOM.hasAddEventListener) {
        return node.removeEventListener(eventName, callback, false);
      } else {
        return node.detachEvent('on' + eventName, callback);
      }
    },
    hasAddEventListener: !!(typeof window !== "undefined" && window !== null ? window.addEventListener : void 0),
    preventDefault: function(e) {
      if (typeof e.preventDefault === "function") {
        return e.preventDefault();
      } else {
        return e.returnValue = false;
      }
    },
    stopPropagation: function(e) {
      if (e.stopPropagation) {
        return e.stopPropagation();
      } else {
        return e.cancelBubble = true;
      }
    },
    willInsertNode: function(node) {
      var child, view, _i, _len, _ref, _ref1;
      view = Batman._data(node, 'view');
      if (view != null) {
        view.fire('beforeAppear', node);
      }
      if ((_ref = Batman.data(node, 'show')) != null) {
        _ref.call(node);
      }
      _ref1 = node.childNodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        child = _ref1[_i];
        Batman.DOM.willInsertNode(child);
      }
      return true;
    },
    didInsertNode: function(node) {
      var child, view, _i, _len, _ref;
      view = Batman._data(node, 'view');
      if (view) {
        view.fire('appear', node);
        view.applyYields();
      }
      _ref = node.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        Batman.DOM.didInsertNode(child);
      }
      return true;
    },
    willRemoveNode: function(node) {
      var child, view, _i, _len, _ref, _ref1;
      view = Batman._data(node, 'view');
      if (view) {
        view.fire('beforeDisappear', node);
      }
      if ((_ref = Batman.data(node, 'hide')) != null) {
        _ref.call(node);
      }
      _ref1 = node.childNodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        child = _ref1[_i];
        Batman.DOM.willRemoveNode(child);
      }
      return true;
    },
    didRemoveNode: function(node) {
      var child, view, _i, _len, _ref;
      view = Batman._data(node, 'view');
      if (view) {
        view.retractYields();
        view.fire('disappear', node);
      }
      _ref = node.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        Batman.DOM.didRemoveNode(child);
      }
      return true;
    },
    willDestroyNode: function(node) {
      var child, view, _i, _len, _ref;
      view = Batman._data(node, 'view');
      if (view) {
        view.fire('beforeDestroy', node);
        view.get('yields').forEach(function(name, actions) {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = actions.length; _i < _len; _i++) {
            node = actions[_i].node;
            _results.push(Batman.DOM.willDestroyNode(node));
          }
          return _results;
        });
      }
      _ref = node.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        Batman.DOM.willDestroyNode(child);
      }
      return true;
    },
    didDestroyNode: function(node) {
      var bindings, child, eventListeners, eventName, listeners, view, _i, _len, _ref;
      view = Batman._data(node, 'view');
      if (view) {
        view.die();
      }
      if (bindings = Batman._data(node, 'bindings')) {
        bindings.forEach(function(binding) {
          return binding.die();
        });
      }
      if (listeners = Batman._data(node, 'listeners')) {
        for (eventName in listeners) {
          eventListeners = listeners[eventName];
          eventListeners.forEach(function(listener) {
            return Batman.DOM.removeEventListener(node, eventName, listener);
          });
        }
      }
      Batman.removeData(node);
      Batman.removeData(node, void 0, true);
      _ref = node.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        Batman.DOM.didDestroyNode(child);
      }
      return true;
    }
  };

  Batman.mixin(Batman.DOM, Batman.EventEmitter, Batman.Observable);

  Batman.DOM.event('bindingAdded');

}).call(this);

(function() {

  Batman.DOM.ReaderBindingDefinition = (function() {

    function ReaderBindingDefinition(node, keyPath, context, renderer) {
      this.node = node;
      this.keyPath = keyPath;
      this.context = context;
      this.renderer = renderer;
    }

    return ReaderBindingDefinition;

  })();

  Batman.BindingDefinitionOnlyObserve = {
    Data: 'data',
    Node: 'node',
    All: 'all',
    None: 'none'
  };

  Batman.DOM.readers = {
    target: function(definition) {
      definition.onlyObserve = Batman.BindingDefinitionOnlyObserve.Node;
      return Batman.DOM.readers.bind(definition);
    },
    source: function(definition) {
      definition.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;
      return Batman.DOM.readers.bind(definition);
    },
    bind: function(definition) {
      var bindingClass, node;
      node = definition.node;
      switch (node.nodeName.toLowerCase()) {
        case 'input':
          switch (node.getAttribute('type')) {
            case 'checkbox':
              definition.attr = 'checked';
              Batman.DOM.attrReaders.bind(definition);
              return true;
            case 'radio':
              bindingClass = Batman.DOM.RadioBinding;
              break;
            case 'file':
              bindingClass = Batman.DOM.FileBinding;
          }
          break;
        case 'select':
          bindingClass = Batman.DOM.SelectBinding;
      }
      bindingClass || (bindingClass = Batman.DOM.ValueBinding);
      return new bindingClass(definition);
    },
    context: function(definition) {
      return definition.context.descendWithDefinition(definition);
    },
    mixin: function(definition) {
      definition.context = definition.context.descend(Batman.mixins);
      return new Batman.DOM.MixinBinding(definition);
    },
    showif: function(definition) {
      return new Batman.DOM.ShowHideBinding(definition);
    },
    hideif: function(definition) {
      definition.invert = true;
      return new Batman.DOM.ShowHideBinding(definition);
    },
    insertif: function(definition) {
      return new Batman.DOM.InsertionBinding(definition);
    },
    removeif: function(definition) {
      definition.invert = true;
      return new Batman.DOM.InsertionBinding(definition);
    },
    route: function(definition) {
      return new Batman.DOM.RouteBinding(definition);
    },
    view: function(definition) {
      return new Batman.DOM.ViewBinding(definition);
    },
    partial: function(definition) {
      return Batman.DOM.partial(definition.node, definition.keyPath, definition.context, definition.renderer);
    },
    defineview: function(definition) {
      var node;
      node = definition.node;
      Batman.DOM.onParseExit(node, function() {
        var _ref;
        return (_ref = node.parentNode) != null ? _ref.removeChild(node) : void 0;
      });
      Batman.DOM.defineView(definition.keyPath, node);
      return {
        skipChildren: true
      };
    },
    renderif: function(definition) {
      return new Batman.DOM.DeferredRenderingBinding(definition);
    },
    "yield": function(definition) {
      var keyPath, node;
      node = definition.node, keyPath = definition.keyPath;
      return Batman.DOM.onParseExit(node, function() {
        return Batman.DOM.Yield.withName(keyPath).set('containerNode', node);
      });
    },
    contentfor: function(definition) {
      var keyPath, node, renderer, swapMethod, value;
      node = definition.node, value = definition.value, swapMethod = definition.swapMethod, renderer = definition.renderer, keyPath = definition.keyPath;
      swapMethod || (swapMethod = 'append');
      return Batman.DOM.onParseExit(node, function() {
        var _ref;
        if ((_ref = node.parentNode) != null) {
          _ref.removeChild(node);
        }
        return renderer.view.pushYieldAction(keyPath, swapMethod, node);
      });
    },
    replace: function(definition) {
      definition.swapMethod = 'replace';
      return Batman.DOM.readers.contentfor(definition);
    }
  };

}).call(this);

(function() {
  var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Batman.DOM.events = {
    click: function(node, callback, context, eventName) {
      if (eventName == null) {
        eventName = 'click';
      }
      Batman.DOM.addEventListener(node, eventName, function() {
        var args, event;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (event.metaKey || event.ctrlKey || event.button === 1) {
          return;
        }
        Batman.DOM.preventDefault(event);
        if (!Batman.DOM.eventIsAllowed(eventName, event)) {
          return;
        }
        return callback.apply(null, [node, event].concat(__slice.call(args), [context]));
      });
      if (node.nodeName.toUpperCase() === 'A' && !node.href) {
        node.href = '#';
      }
      return node;
    },
    doubleclick: function(node, callback, context) {
      return Batman.DOM.events.click(node, callback, context, 'dblclick');
    },
    change: function(node, callback, context) {
      var eventName, eventNames, oldCallback, _i, _len, _results;
      eventNames = (function() {
        var _ref;
        switch (node.nodeName.toUpperCase()) {
          case 'TEXTAREA':
            return ['input', 'keyup', 'change'];
          case 'INPUT':
            if (_ref = node.type.toLowerCase(), __indexOf.call(Batman.DOM.textInputTypes, _ref) >= 0) {
              oldCallback = callback;
              callback = function(node, event) {
                if (event.type === 'keyup' && Batman.DOM.events.isEnter(event)) {
                  return;
                }
                return oldCallback(node, event);
              };
              return ['input', 'keyup', 'change'];
            } else {
              return ['input', 'change'];
            }
            break;
          default:
            return ['change'];
        }
      })();
      _results = [];
      for (_i = 0, _len = eventNames.length; _i < _len; _i++) {
        eventName = eventNames[_i];
        _results.push(Batman.DOM.addEventListener(node, eventName, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return callback.apply(null, [node].concat(__slice.call(args), [context]));
        }));
      }
      return _results;
    },
    isEnter: function(ev) {
      var _ref, _ref1;
      return ((13 <= (_ref = ev.keyCode) && _ref <= 14)) || ((13 <= (_ref1 = ev.which) && _ref1 <= 14)) || ev.keyIdentifier === 'Enter' || ev.key === 'Enter';
    },
    submit: function(node, callback, context) {
      if (Batman.DOM.nodeIsEditable(node)) {
        Batman.DOM.addEventListener(node, 'keydown', function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (Batman.DOM.events.isEnter(args[0])) {
            return Batman.DOM._keyCapturingNode = node;
          }
        });
        Batman.DOM.addEventListener(node, 'keyup', function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (Batman.DOM.events.isEnter(args[0])) {
            if (Batman.DOM._keyCapturingNode === node) {
              Batman.DOM.preventDefault(args[0]);
              callback.apply(null, [node].concat(__slice.call(args), [context]));
            }
            return Batman.DOM._keyCapturingNode = null;
          }
        });
      } else {
        Batman.DOM.addEventListener(node, 'submit', function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          Batman.DOM.preventDefault(args[0]);
          return callback.apply(null, [node].concat(__slice.call(args), [context]));
        });
      }
      return node;
    },
    other: function(node, eventName, callback, context) {
      return Batman.DOM.addEventListener(node, eventName, function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return callback.apply(null, [node].concat(__slice.call(args), [context]));
      });
    }
  };

  Batman.DOM.eventIsAllowed = function(eventName, event) {
    var delegate, _ref, _ref1;
    if (delegate = (_ref = Batman.currentApp) != null ? (_ref1 = _ref.shouldAllowEvent) != null ? _ref1[eventName] : void 0 : void 0) {
      if (delegate(event) === false) {
        return false;
      }
    }
    return true;
  };

}).call(this);

(function() {

  Batman.DOM.AttrReaderBindingDefinition = (function() {

    function AttrReaderBindingDefinition(node, attr, keyPath, context, renderer) {
      this.node = node;
      this.attr = attr;
      this.keyPath = keyPath;
      this.context = context;
      this.renderer = renderer;
    }

    return AttrReaderBindingDefinition;

  })();

  Batman.DOM.attrReaders = {
    _parseAttribute: function(value) {
      if (value === 'false') {
        value = false;
      }
      if (value === 'true') {
        value = true;
      }
      return value;
    },
    source: function(definition) {
      definition.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;
      return Batman.DOM.attrReaders.bind(definition);
    },
    bind: function(definition) {
      var bindingClass;
      bindingClass = (function() {
        switch (definition.attr) {
          case 'checked':
          case 'disabled':
          case 'selected':
            return Batman.DOM.CheckedBinding;
          case 'value':
          case 'href':
          case 'src':
          case 'size':
            return Batman.DOM.NodeAttributeBinding;
          case 'class':
            return Batman.DOM.ClassBinding;
          case 'style':
            return Batman.DOM.StyleBinding;
          default:
            return Batman.DOM.AttributeBinding;
        }
      })();
      return new bindingClass(definition);
    },
    context: function(definition) {
      return definition.context.descendWithDefinition(definition);
    },
    event: function(definition) {
      return new Batman.DOM.EventBinding(definition);
    },
    addclass: function(definition) {
      return new Batman.DOM.AddClassBinding(definition);
    },
    removeclass: function(definition) {
      definition.invert = true;
      return new Batman.DOM.AddClassBinding(definition);
    },
    foreach: function(definition) {
      return new Batman.DOM.IteratorBinding(definition);
    },
    formfor: function(definition) {
      new Batman.DOM.FormBinding(definition);
      return definition.context.descendWithDefinition(definition);
    }
  };

}).call(this);

(function() {
  var BatmanObject, ObjectFunctions, getAccessorObject, promiseWrapper, wrapSingleAccessor,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  getAccessorObject = function(base, accessor) {
    var deprecated, _i, _len, _ref;
    if (typeof accessor === 'function') {
      accessor = {
        get: accessor
      };
    }
    _ref = ['cachable', 'cacheable'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      deprecated = _ref[_i];
      if (deprecated in accessor) {
        Batman.developer.warn("Property accessor option \"" + deprecated + "\" is deprecated. Use \"cache\" instead.");
        if (!('cache' in accessor)) {
          accessor.cache = accessor[deprecated];
        }
      }
    }
    return accessor;
  };

  promiseWrapper = function(fetcher) {
    return function(defaultAccessor) {
      return {
        get: function(key) {
          var asyncDeliver, existingValue, newValue, _base, _base1, _ref, _ref1,
            _this = this;
          if ((existingValue = defaultAccessor.get.apply(this, arguments)) != null) {
            return existingValue;
          }
          asyncDeliver = false;
          newValue = void 0;
          if ((_ref = (_base = this._batman).promises) == null) {
            _base.promises = {};
          }
          if ((_ref1 = (_base1 = this._batman.promises)[key]) == null) {
            _base1[key] = (function() {
              var deliver, returnValue;
              deliver = function(err, result) {
                if (asyncDeliver) {
                  _this.set(key, result);
                }
                return newValue = result;
              };
              returnValue = fetcher.call(_this, deliver, key);
              if (newValue == null) {
                newValue = returnValue;
              }
              return true;
            })();
          }
          asyncDeliver = true;
          return newValue;
        },
        cache: true
      };
    };
  };

  wrapSingleAccessor = function(core, wrapper) {
    var k, v;
    wrapper = (typeof wrapper === "function" ? wrapper(core) : void 0) || wrapper;
    for (k in core) {
      v = core[k];
      if (!(k in wrapper)) {
        wrapper[k] = v;
      }
    }
    return wrapper;
  };

  ObjectFunctions = {
    _defineAccessor: function() {
      var accessor, key, keys, _base, _i, _j, _len, _ref, _results;
      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), accessor = arguments[_i++];
      if (!(accessor != null)) {
        return Batman.Property.defaultAccessorForBase(this);
      } else if (keys.length === 0 && ((_ref = Batman.typeOf(accessor)) !== 'Object' && _ref !== 'Function')) {
        return Batman.Property.accessorForBaseAndKey(this, accessor);
      } else if (typeof accessor.promise === 'function') {
        return this._defineWrapAccessor.apply(this, __slice.call(keys).concat([promiseWrapper(accessor.promise)]));
      }
      Batman.initializeObject(this);
      if (keys.length === 0) {
        return this._batman.defaultAccessor = getAccessorObject(this, accessor);
      } else {
        (_base = this._batman).keyAccessors || (_base.keyAccessors = new Batman.SimpleHash);
        _results = [];
        for (_j = 0, _len = keys.length; _j < _len; _j++) {
          key = keys[_j];
          _results.push(this._batman.keyAccessors.set(key, getAccessorObject(this, accessor)));
        }
        return _results;
      }
    },
    _defineWrapAccessor: function() {
      var key, keys, wrapper, _i, _j, _len, _results;
      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), wrapper = arguments[_i++];
      Batman.initializeObject(this);
      if (keys.length === 0) {
        return this._defineAccessor(wrapSingleAccessor(this._defineAccessor(), wrapper));
      } else {
        _results = [];
        for (_j = 0, _len = keys.length; _j < _len; _j++) {
          key = keys[_j];
          _results.push(this._defineAccessor(key, wrapSingleAccessor(this._defineAccessor(key), wrapper)));
        }
        return _results;
      }
    },
    _resetPromises: function() {
      var key;
      if (this._batman.promises == null) {
        return;
      }
      for (key in this._batman.promises) {
        this._resetPromise(key);
      }
    },
    _resetPromise: function(key) {
      this.unset(key);
      this.property(key).cached = false;
      delete this._batman.promises[key];
    }
  };

  BatmanObject = (function(_super) {
    var counter;

    __extends(BatmanObject, _super);

    Batman.initializeObject(BatmanObject);

    Batman.initializeObject(BatmanObject.prototype);

    Batman.mixin(BatmanObject.prototype, ObjectFunctions, Batman.EventEmitter, Batman.Observable);

    Batman.mixin(BatmanObject, ObjectFunctions, Batman.EventEmitter, Batman.Observable);

    BatmanObject.classMixin = function() {
      return Batman.mixin.apply(Batman, [this].concat(__slice.call(arguments)));
    };

    BatmanObject.mixin = function() {
      return this.classMixin.apply(this.prototype, arguments);
    };

    BatmanObject.prototype.mixin = BatmanObject.classMixin;

    BatmanObject.classAccessor = BatmanObject._defineAccessor;

    BatmanObject.accessor = function() {
      var _ref;
      return (_ref = this.prototype)._defineAccessor.apply(_ref, arguments);
    };

    BatmanObject.prototype.accessor = BatmanObject._defineAccessor;

    BatmanObject.wrapClassAccessor = BatmanObject._defineWrapAccessor;

    BatmanObject.wrapAccessor = function() {
      var _ref;
      return (_ref = this.prototype)._defineWrapAccessor.apply(_ref, arguments);
    };

    BatmanObject.prototype.wrapAccessor = BatmanObject._defineWrapAccessor;

    BatmanObject.observeAll = function() {
      return this.prototype.observe.apply(this.prototype, arguments);
    };

    BatmanObject.singleton = function(singletonMethodName) {
      if (singletonMethodName == null) {
        singletonMethodName = "sharedInstance";
      }
      return this.classAccessor(singletonMethodName, {
        get: function() {
          var _name;
          return this[_name = "_" + singletonMethodName] || (this[_name] = new this);
        }
      });
    };

    BatmanObject.accessor('_batmanID', function() {
      return this._batmanID();
    });

    function BatmanObject() {
      var mixins;
      mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this._batman = new Batman._Batman(this);
      this.mixin.apply(this, mixins);
    }

    counter = 0;

    BatmanObject.prototype._batmanID = function() {
      var _base, _ref;
      this._batman.check(this);
      if ((_ref = (_base = this._batman).id) == null) {
        _base.id = counter++;
      }
      return this._batman.id;
    };

    BatmanObject.prototype.hashKey = function() {
      var _base;
      if (typeof this.isEqual === 'function') {
        return;
      }
      return (_base = this._batman).hashKey || (_base.hashKey = "<Batman.Object " + (this._batmanID()) + ">");
    };

    BatmanObject.prototype.toJSON = function() {
      var key, obj, value;
      obj = {};
      for (key in this) {
        if (!__hasProp.call(this, key)) continue;
        value = this[key];
        if (key !== "_batman" && key !== "hashKey" && key !== "_batmanID") {
          obj[key] = (value != null ? value.toJSON : void 0) ? value.toJSON() : value;
        }
      }
      return obj;
    };

    return BatmanObject;

  })(Object);

  Batman.Object = BatmanObject;

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Renderer = (function(_super) {
    var bindingRegexp, bindingSortOrder, bindingSortPositions, k, name, pos, _i, _j, _len, _len1, _ref;

    __extends(Renderer, _super);

    Renderer.prototype.deferEvery = 50;

    function Renderer(node, context, view) {
      this.node = node;
      this.context = context;
      this.view = view;
      this.resume = __bind(this.resume, this);

      this.start = __bind(this.start, this);

      Renderer.__super__.constructor.call(this);
      if (!(this.context instanceof Batman.RenderContext)) {
        Batman.developer.error("Must pass a RenderContext to a renderer for rendering");
      }
      this.immediate = Batman.setImmediate(this.start);
    }

    Renderer.prototype.start = function() {
      this.startTime = new Date;
      this.prevent('parsed');
      this.prevent('rendered');
      return this.parseNode(this.node);
    };

    Renderer.prototype.resume = function() {
      this.startTime = new Date;
      return this.parseNode(this.resumeNode);
    };

    Renderer.prototype.finish = function() {
      this.startTime = null;
      this.prevent('stopped');
      this.allowAndFire('parsed');
      return this.allowAndFire('rendered');
    };

    Renderer.prototype.stop = function() {
      Batman.clearImmediate(this.immediate);
      return this.fire('stopped');
    };

    _ref = ['parsed', 'rendered', 'stopped'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      Renderer.prototype.event(k).oneShot = true;
    }

    bindingRegexp = /^data\-(.*)/;

    bindingSortOrder = ["view", "renderif", "foreach", "formfor", "context", "bind", "source", "target"];

    bindingSortPositions = {};

    for (pos = _j = 0, _len1 = bindingSortOrder.length; _j < _len1; pos = ++_j) {
      name = bindingSortOrder[pos];
      bindingSortPositions[name] = pos;
    }

    Renderer.prototype._sortBindings = function(a, b) {
      var aindex, bindex;
      aindex = bindingSortPositions[a[0]];
      bindex = bindingSortPositions[b[0]];
      if (aindex == null) {
        aindex = bindingSortOrder.length;
      }
      if (bindex == null) {
        bindex = bindingSortOrder.length;
      }
      if (aindex > bindex) {
        return 1;
      } else if (bindex > aindex) {
        return -1;
      } else if (a[0] > b[0]) {
        return 1;
      } else if (b[0] > a[0]) {
        return -1;
      } else {
        return 0;
      }
    };

    Renderer.prototype.parseNode = function(node) {
      var attr, attribute, binding, bindingDefinition, bindings, names, nextNode, oldContext, reader, skipChildren, value, _k, _l, _len2, _len3, _ref1, _ref2, _ref3, _ref4,
        _this = this;
      if (this.deferEvery && (new Date - this.startTime) > this.deferEvery) {
        this.resumeNode = node;
        this.timeout = Batman.setImmediate(this.resume);
        return;
      }
      if (node.getAttribute && node.attributes) {
        bindings = [];
        _ref1 = node.attributes;
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          attribute = _ref1[_k];
          name = (_ref2 = attribute.nodeName.match(bindingRegexp)) != null ? _ref2[1] : void 0;
          if (!name) {
            continue;
          }
          bindings.push((names = name.split('-')).length > 1 ? [names[0], names.slice(1, names.length + 1 || 9e9).join('-'), attribute.value] : [name, void 0, attribute.value]);
        }
        _ref3 = bindings.sort(this._sortBindings);
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          _ref4 = _ref3[_l], name = _ref4[0], attr = _ref4[1], value = _ref4[2];
          binding = attr ? (reader = Batman.DOM.attrReaders[name]) ? (bindingDefinition = new Batman.DOM.AttrReaderBindingDefinition(node, attr, value, this.context, this), reader(bindingDefinition)) : void 0 : (reader = Batman.DOM.readers[name]) ? (bindingDefinition = new Batman.DOM.ReaderBindingDefinition(node, value, this.context, this), reader(bindingDefinition)) : void 0;
          if (binding instanceof Batman.RenderContext) {
            oldContext = this.context;
            this.context = binding;
            Batman.DOM.onParseExit(node, function() {
              return _this.context = oldContext;
            });
          } else if (binding != null ? binding.skipChildren : void 0) {
            skipChildren = true;
            break;
          }
        }
      }
      if ((nextNode = this.nextNode(node, skipChildren))) {
        return this.parseNode(nextNode);
      } else {
        return this.finish();
      }
    };

    Renderer.prototype.nextNode = function(node, skipChildren) {
      var children, nextParent, parentSibling, sibling, _ref1, _ref2;
      if (!skipChildren) {
        children = node.childNodes;
        if (children != null ? children.length : void 0) {
          return children[0];
        }
      }
      sibling = node.nextSibling;
      if ((_ref1 = Batman.DOM.onParseExit(node)) != null) {
        _ref1.forEach(function(callback) {
          return callback();
        });
      }
      Batman.DOM.forgetParseExit(node);
      if (this.node === node) {
        return;
      }
      if (sibling) {
        return sibling;
      }
      nextParent = node;
      while (nextParent = nextParent.parentNode) {
        parentSibling = nextParent.nextSibling;
        if ((_ref2 = Batman.DOM.onParseExit(nextParent)) != null) {
          _ref2.forEach(function(callback) {
            return callback();
          });
        }
        Batman.DOM.forgetParseExit(nextParent);
        if (this.node === nextParent) {
          return;
        }
        if (parentSibling) {
          return parentSibling;
        }
      }
    };

    return Renderer;

  })(Batman.Object);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.AbstractBinding = (function(_super) {
    var get_dot_rx, get_rx, keypath_rx, onlyAll, onlyData, onlyNode;

    __extends(AbstractBinding, _super);

    keypath_rx = /(^|,)\s*(?:(true|false)|("[^"]*")|(\{[^\}]*\})|(([0-9]+[a-zA-Z\_]|[a-zA-Z])[\w\-\.]*[\?\!]?))\s*(?=$|,)/g;

    get_dot_rx = /(?:\]\.)(.+?)(?=[\[\.]|\s*\||$)/;

    get_rx = /(?!^\s*)\[(.*?)\]/g;

    AbstractBinding.accessor('filteredValue', {
      get: function() {
        var renderContext, result, self, unfilteredValue;
        unfilteredValue = this.get('unfilteredValue');
        self = this;
        renderContext = this.get('renderContext');
        if (this.filterFunctions.length > 0) {
          Batman.developer.currentFilterStack = renderContext;
          result = this.filterFunctions.reduce(function(value, fn, i) {
            var args;
            args = self.filterArguments[i].map(function(argument) {
              if (argument._keypath) {
                return self.renderContext.get(argument._keypath);
              } else {
                return argument;
              }
            });
            args.unshift(value);
            while (args.length < (fn.length - 1)) {
              args.push(void 0);
            }
            args.push(self);
            return fn.apply(renderContext, args);
          }, unfilteredValue);
          Batman.developer.currentFilterStack = null;
          return result;
        } else {
          return unfilteredValue;
        }
      },
      set: function(_, newValue) {
        return this.set('unfilteredValue', newValue);
      }
    });

    AbstractBinding.accessor('unfilteredValue', {
      get: function() {
        var k;
        if (k = this.get('key')) {
          return Batman.RenderContext.deProxy(Batman.getPath(this, ['keyContext', k]));
        } else {
          return this.get('value');
        }
      },
      set: function(_, value) {
        var k, keyContext, prop;
        if (k = this.get('key')) {
          keyContext = this.get('keyContext');
          if (keyContext && keyContext !== Batman.container) {
            prop = Batman.Property.forBaseAndKey(keyContext, k);
            return prop.setValue(value);
          }
        } else {
          return this.set('value', value);
        }
      }
    });

    AbstractBinding.accessor('keyContext', function() {
      return this.renderContext.contextForKey(this.key);
    });

    onlyAll = Batman.BindingDefinitionOnlyObserve.All;

    onlyData = Batman.BindingDefinitionOnlyObserve.Data;

    onlyNode = Batman.BindingDefinitionOnlyObserve.Node;

    AbstractBinding.prototype.bindImmediately = true;

    AbstractBinding.prototype.shouldSet = true;

    AbstractBinding.prototype.isInputBinding = false;

    AbstractBinding.prototype.escapeValue = true;

    AbstractBinding.prototype.onlyObserve = onlyAll;

    AbstractBinding.prototype.skipParseFilter = false;

    function AbstractBinding(definition) {
      this._fireDataChange = __bind(this._fireDataChange, this);
      this.node = definition.node, this.keyPath = definition.keyPath, this.renderContext = definition.context, this.renderer = definition.renderer;
      if (definition.onlyObserve) {
        this.onlyObserve = definition.onlyObserve;
      }
      if (definition.skipParseFilter != null) {
        this.skipParseFilter = definition.skipParseFilter;
      }
      if (!this.skipParseFilter) {
        this.parseFilter();
      }
      if (this.bindImmediately) {
        this.bind();
      }
    }

    AbstractBinding.prototype.isTwoWay = function() {
      return (this.key != null) && this.filterFunctions.length === 0;
    };

    AbstractBinding.prototype.bind = function() {
      var _ref, _ref1;
      if (this.node && ((_ref = this.onlyObserve) === onlyAll || _ref === onlyNode) && Batman.DOM.nodeIsEditable(this.node)) {
        Batman.DOM.events.change(this.node, this._fireNodeChange.bind(this));
        if (this.onlyObserve === onlyNode) {
          this._fireNodeChange();
        }
      }
      if ((_ref1 = this.onlyObserve) === onlyAll || _ref1 === onlyData) {
        this.observeAndFire('filteredValue', this._fireDataChange);
      }
      if (this.node) {
        return Batman.DOM.trackBinding(this, this.node);
      }
    };

    AbstractBinding.prototype._fireNodeChange = function(event) {
      var val;
      this.shouldSet = false;
      val = this.value || this.get('keyContext');
      if (typeof this.nodeChange === "function") {
        this.nodeChange(this.node, val, event);
      }
      this.fire('nodeChange', this.node, val);
      return this.shouldSet = true;
    };

    AbstractBinding.prototype._fireDataChange = function(value) {
      if (this.shouldSet) {
        if (typeof this.dataChange === "function") {
          this.dataChange(value, this.node);
        }
        return this.fire('dataChange', value, this.node);
      }
    };

    AbstractBinding.prototype.die = function() {
      var _ref;
      this.forget();
      if ((_ref = this._batman.properties) != null) {
        _ref.forEach(function(key, property) {
          return property.die();
        });
      }
      this.fire('die');
      this.node = null;
      this.keyPath = null;
      this.renderContext = null;
      this.renderer = null;
      this.dead = true;
      return true;
    };

    AbstractBinding.prototype.parseFilter = function() {
      var args, filter, filterName, filterString, filters, key, keyPath, orig, split;
      this.filterFunctions = [];
      this.filterArguments = [];
      keyPath = this.keyPath;
      while (get_dot_rx.test(keyPath)) {
        keyPath = keyPath.replace(get_dot_rx, "]['$1']");
      }
      filters = keyPath.replace(get_rx, " | get $1 ").replace(/'/g, '"').split(/(?!")\s+\|\s+(?!")/);
      try {
        key = this.parseSegment(orig = filters.shift())[0];
      } catch (e) {
        Batman.developer.warn(e);
        Batman.developer.error("Error! Couldn't parse keypath in \"" + orig + "\". Parsing error above.");
      }
      if (key && key._keypath) {
        this.key = key._keypath;
      } else {
        this.value = key;
      }
      if (filters.length) {
        while (filterString = filters.shift()) {
          split = filterString.indexOf(' ');
          if (split === -1) {
            split = filterString.length;
          }
          filterName = filterString.substr(0, split);
          args = filterString.substr(split);
          if (!(filter = Batman.Filters[filterName])) {
            return Batman.developer.error("Unrecognized filter '" + filterName + "' in key \"" + this.keyPath + "\"!");
          }
          this.filterFunctions.push(filter);
          try {
            this.filterArguments.push(this.parseSegment(args));
          } catch (e) {
            Batman.developer.error("Bad filter arguments \"" + args + "\"!");
          }
        }
        return true;
      }
    };

    AbstractBinding.prototype.parseSegment = function(segment) {
      segment = segment.replace(keypath_rx, function(match, start, bool, string, object, keypath, offset) {
        var replacement;
        if (start == null) {
          start = '';
        }
        replacement = keypath ? '{"_keypath": "' + keypath + '"}' : bool || string || object;
        return start + replacement;
      });
      return JSON.parse("[" + segment + "]");
    };

    return AbstractBinding;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.ViewBinding = (function(_super) {

    __extends(ViewBinding, _super);

    ViewBinding.prototype.skipChildren = true;

    ViewBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function ViewBinding() {
      ViewBinding.__super__.constructor.apply(this, arguments);
      this.renderer.prevent('rendered');
      this.node.removeAttribute('data-view');
    }

    ViewBinding.prototype.dataChange = function(viewClassOrInstance) {
      var _ref,
        _this = this;
      if (viewClassOrInstance == null) {
        return;
      }
      if (viewClassOrInstance.isView) {
        this.view = viewClassOrInstance;
        this.view.set('context', this.renderContext);
        this.view.set('node', this.node);
      } else {
        this.view = new viewClassOrInstance({
          node: this.node,
          context: this.renderContext,
          parentView: this.renderer.view
        });
      }
      this.view.on('ready', function() {
        return _this.renderer.allowAndFire('rendered');
      });
      this.forget();
      return (_ref = this._batman.properties) != null ? _ref.forEach(function(key, property) {
        return property.die();
      }) : void 0;
    };

    ViewBinding.prototype.die = function() {
      this.view = null;
      return ViewBinding.__super__.die.apply(this, arguments);
    };

    return ViewBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.ViewArgumentBinding = (function(_super) {

    __extends(ViewArgumentBinding, _super);

    function ViewArgumentBinding() {
      return ViewArgumentBinding.__super__.constructor.apply(this, arguments);
    }

    ViewArgumentBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.None;

    return ViewArgumentBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.ValueBinding = (function(_super) {

    __extends(ValueBinding, _super);

    function ValueBinding(definition) {
      var _ref;
      this.isInputBinding = (_ref = definition.node.nodeName.toLowerCase()) === 'input' || _ref === 'textarea';
      ValueBinding.__super__.constructor.apply(this, arguments);
    }

    ValueBinding.prototype.nodeChange = function(node, context) {
      if (this.isTwoWay()) {
        return this.set('filteredValue', this.node.value);
      }
    };

    ValueBinding.prototype.dataChange = function(value, node) {
      return Batman.DOM.valueForNode(this.node, value, this.escapeValue);
    };

    return ValueBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.ShowHideBinding = (function(_super) {

    __extends(ShowHideBinding, _super);

    ShowHideBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function ShowHideBinding(definition) {
      var display;
      display = definition.node.style.display;
      if (!display || display === 'none') {
        display = '';
      }
      this.originalDisplay = display;
      this.invert = definition.invert;
      ShowHideBinding.__super__.constructor.apply(this, arguments);
    }

    ShowHideBinding.prototype.dataChange = function(value) {
      var hide, view, _ref;
      view = Batman._data(this.node, 'view');
      if (!!value === !this.invert) {
        if (view != null) {
          view.fire('beforeAppear', this.node);
        }
        if ((_ref = Batman.data(this.node, 'show')) != null) {
          _ref.call(this.node);
        }
        this.node.style.display = this.originalDisplay;
        return view != null ? view.fire('appear', this.node) : void 0;
      } else {
        if (view != null) {
          view.fire('beforeDisappear', this.node);
        }
        if (typeof (hide = Batman.data(this.node, 'hide')) === 'function') {
          hide.call(this.node);
        } else {
          Batman.DOM.setStyleProperty(this.node, 'display', 'none', 'important');
        }
        return view != null ? view.fire('disappear', this.node) : void 0;
      }
    };

    return ShowHideBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.SelectBinding = (function(_super) {

    __extends(SelectBinding, _super);

    SelectBinding.prototype.isInputBinding = true;

    SelectBinding.prototype.canSetImplicitly = true;

    function SelectBinding() {
      this.updateOptionBindings = __bind(this.updateOptionBindings, this);

      this.nodeChange = __bind(this.nodeChange, this);

      this.dataChange = __bind(this.dataChange, this);

      this.childBindingAdded = __bind(this.childBindingAdded, this);
      this.selectedBindings = new Batman.SimpleSet;
      SelectBinding.__super__.constructor.apply(this, arguments);
    }

    SelectBinding.prototype.childBindingAdded = function(binding) {
      var dataChangeHandler,
        _this = this;
      if (binding instanceof Batman.DOM.CheckedBinding) {
        binding.on('dataChange', dataChangeHandler = function() {
          return _this.nodeChange();
        });
        binding.on('die', function() {
          binding.forget('dataChange', dataChangeHandler);
          return _this.selectedBindings.remove(binding);
        });
        this.selectedBindings.add(binding);
      } else if (binding instanceof Batman.DOM.IteratorBinding) {
        binding.on('nodeAdded', dataChangeHandler = function() {
          return _this._fireDataChange(_this.get('filteredValue'));
        });
        binding.on('nodeRemoved', dataChangeHandler);
        binding.on('die', function() {
          binding.forget('nodeAdded', dataChangeHandler);
          return binding.forget('nodeRemoved', dataChangeHandler);
        });
      } else {
        return;
      }
      return this._fireDataChange(this.get('filteredValue'));
    };

    SelectBinding.prototype.lastKeyContext = null;

    SelectBinding.prototype.dataChange = function(newValue) {
      var child, matches, valueToChild, _i, _len, _name, _ref,
        _this = this;
      this.lastKeyContext || (this.lastKeyContext = this.get('keyContext'));
      if (this.lastKeyContext !== this.get('keyContext')) {
        this.canSetImplicitly = true;
        this.lastKeyContext = this.get('keyContext');
      }
      if (newValue != null ? newValue.forEach : void 0) {
        valueToChild = {};
        _ref = this.node.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          child.selected = false;
          matches = valueToChild[_name = child.value] || (valueToChild[_name] = []);
          matches.push(child);
        }
        newValue.forEach(function(value) {
          var children, node, _j, _len1, _results;
          if (children = valueToChild[value]) {
            _results = [];
            for (_j = 0, _len1 = children.length; _j < _len1; _j++) {
              node = children[_j];
              _results.push(node.selected = true);
            }
            return _results;
          }
        });
      } else {
        if (!(newValue != null) && this.canSetImplicitly) {
          if (this.node.value) {
            this.canSetImplicitly = false;
            this.set('unfilteredValue', this.node.value);
          }
        } else {
          this.canSetImplicitly = false;
          Batman.DOM.valueForNode(this.node, newValue, this.escapeValue);
        }
      }
      this.updateOptionBindings();
    };

    SelectBinding.prototype.nodeChange = function() {
      var c, selections;
      if (this.isTwoWay()) {
        selections = this.node.multiple ? (function() {
          var _i, _len, _ref, _results;
          _ref = this.node.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            if (c.selected) {
              _results.push(c.value);
            }
          }
          return _results;
        }).call(this) : this.node.value;
        if (typeof selections === Array && selections.length === 1) {
          selections = selections[0];
        }
        this.set('unfilteredValue', selections);
        this.updateOptionBindings();
      }
    };

    SelectBinding.prototype.updateOptionBindings = function() {
      return this.selectedBindings.forEach(function(binding) {
        return binding._fireNodeChange();
      });
    };

    return SelectBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.RouteBinding = (function(_super) {

    __extends(RouteBinding, _super);

    function RouteBinding() {
      return RouteBinding.__super__.constructor.apply(this, arguments);
    }

    RouteBinding.prototype.onAnchorTag = false;

    RouteBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    RouteBinding.accessor('dispatcher', function() {
      return this.renderContext.get('dispatcher') || Batman.App.get('current.dispatcher');
    });

    RouteBinding.prototype.bind = function() {
      var _this = this;
      if (this.node.nodeName.toUpperCase() === 'A') {
        this.onAnchorTag = true;
      }
      RouteBinding.__super__.bind.apply(this, arguments);
      return Batman.DOM.events.click(this.node, function(node, event) {
        var params;
        if (event.__batmanActionTaken) {
          return;
        }
        event.__batmanActionTaken = true;
        params = _this.pathFromValue(_this.get('filteredValue'));
        if (params != null) {
          return Batman.redirect(params);
        }
      });
    };

    RouteBinding.prototype.dataChange = function(value) {
      var path;
      if (value) {
        path = this.pathFromValue(value);
      }
      if (this.onAnchorTag) {
        if (path && Batman.navigator) {
          path = Batman.navigator.linkTo(path);
        } else {
          path = "#";
        }
        return this.node.href = path;
      }
    };

    RouteBinding.prototype.pathFromValue = function(value) {
      var _ref;
      if (value) {
        if (value.isNamedRouteQuery) {
          return value.get('path');
        } else {
          return (_ref = this.get('dispatcher')) != null ? _ref.pathFromParams(value) : void 0;
        }
      }
    };

    return RouteBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.RadioBinding = (function(_super) {

    __extends(RadioBinding, _super);

    function RadioBinding() {
      return RadioBinding.__super__.constructor.apply(this, arguments);
    }

    RadioBinding.accessor('parsedNodeValue', function() {
      return Batman.DOM.attrReaders._parseAttribute(this.node.value);
    });

    RadioBinding.prototype.firstBind = true;

    RadioBinding.prototype.dataChange = function(value) {
      var boundValue;
      boundValue = this.get('filteredValue');
      if (boundValue != null) {
        this.node.checked = boundValue === Batman.DOM.attrReaders._parseAttribute(this.node.value);
      } else {
        if (this.firstBind && this.node.checked) {
          this.set('filteredValue', this.get('parsedNodeValue'));
        }
      }
      return this.firstBind = false;
    };

    RadioBinding.prototype.nodeChange = function(node) {
      if (this.isTwoWay()) {
        return this.set('filteredValue', this.get('parsedNodeValue'));
      }
    };

    return RadioBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.MixinBinding = (function(_super) {

    __extends(MixinBinding, _super);

    function MixinBinding() {
      return MixinBinding.__super__.constructor.apply(this, arguments);
    }

    MixinBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    MixinBinding.prototype.dataChange = function(value) {
      if (value != null) {
        return Batman.mixin(this.node, value);
      }
    };

    return MixinBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.FileBinding = (function(_super) {

    __extends(FileBinding, _super);

    function FileBinding() {
      return FileBinding.__super__.constructor.apply(this, arguments);
    }

    FileBinding.prototype.isInputBinding = true;

    FileBinding.prototype.nodeChange = function(node, subContext) {
      if (!this.isTwoWay()) {
        return;
      }
      if (node.hasAttribute('multiple')) {
        return this.set('filteredValue', Array.prototype.slice.call(node.files));
      } else {
        return this.set('filteredValue', node.files[0]);
      }
    };

    return FileBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.DeferredRenderingBinding = (function(_super) {

    __extends(DeferredRenderingBinding, _super);

    DeferredRenderingBinding.prototype.rendered = false;

    DeferredRenderingBinding.prototype.skipChildren = true;

    function DeferredRenderingBinding() {
      DeferredRenderingBinding.__super__.constructor.apply(this, arguments);
      this.node.removeAttribute("data-renderif");
    }

    DeferredRenderingBinding.prototype.nodeChange = function() {};

    DeferredRenderingBinding.prototype.dataChange = function(value) {
      if (value && !this.rendered) {
        return this.render();
      }
    };

    DeferredRenderingBinding.prototype.render = function() {
      new Batman.Renderer(this.node, this.renderContext, this.renderer.view);
      return this.rendered = true;
    };

    return DeferredRenderingBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.AbstractAttributeBinding = (function(_super) {

    __extends(AbstractAttributeBinding, _super);

    function AbstractAttributeBinding(definition) {
      this.attributeName = definition.attr;
      AbstractAttributeBinding.__super__.constructor.apply(this, arguments);
    }

    return AbstractAttributeBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.FormBinding = (function(_super) {

    __extends(FormBinding, _super);

    FormBinding.current = null;

    FormBinding.prototype.errorClass = 'error';

    FormBinding.prototype.defaultErrorsListSelector = 'div.errors';

    FormBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.None;

    FormBinding.accessor('errorsListSelector', function() {
      return this.get('node').getAttribute('data-errors-list') || this.defaultErrorsListSelector;
    });

    function FormBinding() {
      this.childBindingAdded = __bind(this.childBindingAdded, this);
      FormBinding.__super__.constructor.apply(this, arguments);
      this.contextName = this.attributeName;
      delete this.attributeName;
      Batman.DOM.events.submit(this.get('node'), function(node, e) {
        return Batman.DOM.preventDefault(e);
      });
      this.setupErrorsList();
    }

    FormBinding.prototype.childBindingAdded = function(binding) {
      var definition, field, index, node;
      if (binding.isInputBinding && Batman.isChildOf(this.get('node'), binding.get('node'))) {
        if (~(index = binding.get('key').indexOf(this.contextName))) {
          node = binding.get('node');
          field = binding.get('key').slice(index + this.contextName.length + 1);
          definition = new Batman.DOM.AttrReaderBindingDefinition(node, this.errorClass, this.get('keyPath') + (" | get 'errors." + field + ".length'"), this.renderContext, this.renderer);
          return new Batman.DOM.AddClassBinding(definition);
        }
      }
    };

    FormBinding.prototype.setupErrorsList = function() {
      if (this.errorsListNode = Batman.DOM.querySelector(this.get('node'), this.get('errorsListSelector'))) {
        Batman.DOM.setInnerHTML(this.errorsListNode, this.errorsListHTML());
        if (!this.errorsListNode.getAttribute('data-showif')) {
          return this.errorsListNode.setAttribute('data-showif', "" + this.contextName + ".errors.length");
        }
      }
    };

    FormBinding.prototype.errorsListHTML = function() {
      return "<ul>\n  <li data-foreach-error=\"" + this.contextName + ".errors\" data-bind=\"error.fullMessage\"></li>\n</ul>";
    };

    return FormBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.EventBinding = (function(_super) {

    __extends(EventBinding, _super);

    EventBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.None;

    function EventBinding() {
      var attacher, callback, confirmText,
        _this = this;
      EventBinding.__super__.constructor.apply(this, arguments);
      if (confirmText = this.node.getAttribute('data-confirm')) {
        Batman.developer.deprecated("data-confirm");
      }
      callback = function() {
        var _ref;
        if (confirmText && !confirm(confirmText)) {
          return;
        }
        return (_ref = _this.get('filteredValue')) != null ? _ref.apply(_this.get('callbackContext'), arguments) : void 0;
      };
      if (attacher = Batman.DOM.events[this.attributeName]) {
        attacher(this.node, callback, this.renderContext);
      } else {
        Batman.DOM.events.other(this.node, this.attributeName, callback, this.renderContext);
      }
    }

    EventBinding.accessor('callbackContext', function() {
      var contextKeySegments;
      contextKeySegments = this.key.split('.');
      contextKeySegments.pop();
      if (contextKeySegments.length > 0) {
        return this.get('keyContext').get(contextKeySegments.join('.'));
      } else {
        return this.get('keyContext');
      }
    });

    EventBinding.wrapAccessor('unfilteredValue', function(core) {
      return {
        get: function() {
          var functionKey, k, keyContext, keys;
          if (k = this.get('key')) {
            keys = k.split('.');
            if (keys.length > 1) {
              functionKey = keys.pop();
              keyContext = Batman.getPath(this, ['keyContext'].concat(keys));
              keyContext = Batman.RenderContext.deProxy(keyContext);
              if (keyContext != null) {
                return keyContext[functionKey];
              }
            }
          }
          return core.get.apply(this, arguments);
        }
      };
    });

    return EventBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.NodeAttributeBinding = (function(_super) {

    __extends(NodeAttributeBinding, _super);

    function NodeAttributeBinding() {
      return NodeAttributeBinding.__super__.constructor.apply(this, arguments);
    }

    NodeAttributeBinding.prototype.dataChange = function(value) {
      if (value == null) {
        value = "";
      }
      return this.node[this.attributeName] = value;
    };

    NodeAttributeBinding.prototype.nodeChange = function(node) {
      if (this.isTwoWay()) {
        return this.set('filteredValue', Batman.DOM.attrReaders._parseAttribute(node[this.attributeName]));
      }
    };

    return NodeAttributeBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.CheckedBinding = (function(_super) {

    __extends(CheckedBinding, _super);

    function CheckedBinding() {
      return CheckedBinding.__super__.constructor.apply(this, arguments);
    }

    CheckedBinding.prototype.isInputBinding = true;

    CheckedBinding.prototype.dataChange = function(value) {
      return this.node[this.attributeName] = !!value;
    };

    return CheckedBinding;

  })(Batman.DOM.NodeAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.AttributeBinding = (function(_super) {

    __extends(AttributeBinding, _super);

    function AttributeBinding() {
      return AttributeBinding.__super__.constructor.apply(this, arguments);
    }

    AttributeBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    AttributeBinding.prototype.dataChange = function(value) {
      return this.node.setAttribute(this.attributeName, value);
    };

    AttributeBinding.prototype.nodeChange = function(node) {
      if (this.isTwoWay()) {
        return this.set('filteredValue', Batman.DOM.attrReaders._parseAttribute(node.getAttribute(this.attributeName)));
      }
    };

    return AttributeBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.AddClassBinding = (function(_super) {

    __extends(AddClassBinding, _super);

    AddClassBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function AddClassBinding(definition) {
      var name;
      this.invert = definition.invert;
      this.classes = (function() {
        var _i, _len, _ref, _results;
        _ref = definition.attr.split('|');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          name = _ref[_i];
          _results.push({
            name: name,
            pattern: new RegExp("(?:^|\\s)" + name + "(?:$|\\s)", 'i')
          });
        }
        return _results;
      })();
      AddClassBinding.__super__.constructor.apply(this, arguments);
    }

    AddClassBinding.prototype.dataChange = function(value) {
      var currentName, includesClassName, name, pattern, _i, _len, _ref, _ref1;
      currentName = this.node.className;
      _ref = this.classes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], name = _ref1.name, pattern = _ref1.pattern;
        includesClassName = pattern.test(currentName);
        if (!!value === !this.invert) {
          if (!includesClassName) {
            this.node.className = "" + currentName + " " + name;
          }
        } else {
          if (includesClassName) {
            this.node.className = currentName.replace(pattern, ' ');
          }
        }
      }
      return true;
    };

    return AddClassBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.AbstractCollectionBinding = (function(_super) {

    __extends(AbstractCollectionBinding, _super);

    function AbstractCollectionBinding() {
      return AbstractCollectionBinding.__super__.constructor.apply(this, arguments);
    }

    AbstractCollectionBinding.prototype.bindCollection = function(newCollection) {
      var _ref;
      if (newCollection instanceof Batman.Hash) {
        newCollection = newCollection.meta;
      }
      if (newCollection === this.collection) {
        return true;
      } else {
        this.unbindCollection();
        this.collection = newCollection;
        if ((_ref = this.collection) != null ? _ref.isObservable : void 0) {
          this.collection.observeAndFire('toArray', this.handleArrayChanged);
          return true;
        }
      }
      return false;
    };

    AbstractCollectionBinding.prototype.unbindCollection = function() {
      var _ref;
      if ((_ref = this.collection) != null ? _ref.isObservable : void 0) {
        return this.collection.forget('toArray', this.handleArrayChanged);
      }
    };

    AbstractCollectionBinding.prototype.handleArrayChanged = function() {};

    AbstractCollectionBinding.prototype.die = function() {
      this.unbindCollection();
      return AbstractCollectionBinding.__super__.die.apply(this, arguments);
    };

    return AbstractCollectionBinding;

  })(Batman.DOM.AbstractAttributeBinding);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.DOM.StyleBinding = (function(_super) {

    __extends(StyleBinding, _super);

    StyleBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function StyleBinding() {
      this.setStyle = __bind(this.setStyle, this);

      this.handleArrayChanged = __bind(this.handleArrayChanged, this);
      this.oldStyles = {};
      this.styleBindings = {};
      StyleBinding.__super__.constructor.apply(this, arguments);
    }

    StyleBinding.prototype.dataChange = function(value) {
      var colonSplitCSSValues, cssName, key, style, _i, _len, _ref, _ref1, _results;
      if (!value) {
        this.resetStyles();
        return;
      }
      this.unbindCollection();
      if (typeof value === 'string') {
        this.resetStyles();
        _ref = value.split(';');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          style = _ref[_i];
          _ref1 = style.split(":"), cssName = _ref1[0], colonSplitCSSValues = 2 <= _ref1.length ? __slice.call(_ref1, 1) : [];
          this.setStyle(cssName, colonSplitCSSValues.join(":"));
        }
        return;
      }
      if (value instanceof Batman.Hash) {
        return this.bindCollection(value);
      } else {
        if (value instanceof Batman.Object) {
          value = value.toJSON();
        }
        this.resetStyles();
        _results = [];
        for (key in value) {
          if (!__hasProp.call(value, key)) continue;
          _results.push(this.bindSingleAttribute(key, "" + this.keyPath + "." + key));
        }
        return _results;
      }
    };

    StyleBinding.prototype.handleArrayChanged = function(array) {
      var _this = this;
      return this.collection.forEach(function(key, value) {
        return _this.bindSingleAttribute(key, "" + _this.keyPath + "." + key);
      });
    };

    StyleBinding.prototype.bindSingleAttribute = function(attr, keyPath) {
      var definition;
      definition = new Batman.DOM.AttrReaderBindingDefinition(this.node, attr, keyPath, this.renderContext, this.renderer);
      return this.styleBindings[attr] = new Batman.DOM.StyleBinding.SingleStyleBinding(definition, this);
    };

    StyleBinding.prototype.setStyle = function(key, value) {
      key = Batman.helpers.camelize(key.trim(), true);
      if (this.oldStyles[key] == null) {
        this.oldStyles[key] = this.node.style[key] || "";
      }
      if (value != null ? value.trim : void 0) {
        value = value.trim();
      }
      if (value == null) {
        value = "";
      }
      return this.node.style[key] = value;
    };

    StyleBinding.prototype.resetStyles = function() {
      var cssName, cssValue, _ref, _results;
      _ref = this.oldStyles;
      _results = [];
      for (cssName in _ref) {
        if (!__hasProp.call(_ref, cssName)) continue;
        cssValue = _ref[cssName];
        _results.push(this.setStyle(cssName, cssValue));
      }
      return _results;
    };

    StyleBinding.prototype.resetBindings = function() {
      var attribute, binding, _ref;
      _ref = this.styleBindings;
      for (attribute in _ref) {
        binding = _ref[attribute];
        binding._fireDataChange('');
        binding.die();
      }
      return this.styleBindings = {};
    };

    StyleBinding.prototype.unbindCollection = function() {
      this.resetBindings();
      return StyleBinding.__super__.unbindCollection.apply(this, arguments);
    };

    StyleBinding.SingleStyleBinding = (function(_super1) {

      __extends(SingleStyleBinding, _super1);

      SingleStyleBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

      SingleStyleBinding.prototype.isTwoWay = function() {
        return false;
      };

      function SingleStyleBinding(definition, parent) {
        this.parent = parent;
        SingleStyleBinding.__super__.constructor.call(this, definition);
      }

      SingleStyleBinding.prototype.dataChange = function(value) {
        return this.parent.setStyle(this.attributeName, value);
      };

      return SingleStyleBinding;

    })(Batman.DOM.AbstractAttributeBinding);

    return StyleBinding;

  })(Batman.DOM.AbstractCollectionBinding);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.IteratorBinding = (function(_super) {

    __extends(IteratorBinding, _super);

    IteratorBinding.prototype.currentActionNumber = 0;

    IteratorBinding.prototype.queuedActionNumber = 0;

    IteratorBinding.prototype.bindImmediately = false;

    IteratorBinding.prototype.skipChildren = true;

    IteratorBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function IteratorBinding(definition) {
      this.handleArrayChanged = __bind(this.handleArrayChanged, this);

      var previousSiblingNode, sourceNode,
        _this = this;
      sourceNode = definition.node, this.iteratorName = definition.attr, this.key = definition.keyPath, this.parentRenderer = definition.renderer;
      this.nodeMap = new Batman.SimpleHash;
      this.rendererMap = new Batman.SimpleHash;
      this.prototypeNode = sourceNode.cloneNode(true);
      this.prototypeNode.removeAttribute("data-foreach-" + this.iteratorName);
      previousSiblingNode = sourceNode.nextSibling;
      this.startNode = document.createComment("start " + this.iteratorName + "-" + (this.get('_batmanID')));
      this.endNode = document.createComment("end " + this.iteratorName + "-" + (this.get('_batmanID')));
      this.endNode[Batman.expando] = sourceNode[Batman.expando];
      if (Batman.canDeleteExpando) {
        delete sourceNode[Batman.expando];
      }
      Batman.DOM.insertBefore(sourceNode.parentNode, this.startNode, previousSiblingNode);
      Batman.DOM.insertBefore(sourceNode.parentNode, this.endNode, previousSiblingNode);
      this.parentRenderer.prevent('rendered');
      Batman.DOM.onParseExit(sourceNode.parentNode, function() {
        Batman.DOM.destroyNode(sourceNode);
        _this.bind();
        return _this.parentRenderer.allowAndFire('rendered');
      });
      definition.node = this.endNode;
      IteratorBinding.__super__.constructor.apply(this, arguments);
    }

    IteratorBinding.prototype.parentNode = function() {
      return this.endNode.parentNode;
    };

    IteratorBinding.prototype.dataChange = function(collection) {
      var items, _items;
      if (collection != null) {
        if (!this.bindCollection(collection)) {
          items = (collection != null ? collection.forEach : void 0) ? (_items = [], collection.forEach(function(item) {
            return _items.push(item);
          }), _items) : Object.keys(collection);
          return this.handleArrayChanged(items);
        }
      } else {
        return this.handleArrayChanged([]);
      }
    };

    IteratorBinding.prototype.handleArrayChanged = function(newItems) {
      var existingNode, index, newItem, node, nodeAtIndex, parentNode, startIndex, unseenNodeMap, _i, _len,
        _this = this;
      parentNode = this.parentNode();
      startIndex = this._getStartNodeIndex() + 1;
      unseenNodeMap = this.nodeMap.merge();
      if (newItems) {
        for (index = _i = 0, _len = newItems.length; _i < _len; index = ++_i) {
          newItem = newItems[index];
          nodeAtIndex = parentNode.childNodes[startIndex + index];
          if ((nodeAtIndex != null) && this._itemForNode(nodeAtIndex) === newItem) {
            unseenNodeMap.unset(newItem);
            continue;
          } else {
            node = (existingNode = this.nodeMap.get(newItem)) ? (unseenNodeMap.unset(newItem), existingNode) : this._newNodeForItem(newItem);
            Batman.DOM.insertBefore(this.parentNode(), node, nodeAtIndex);
          }
        }
      }
      unseenNodeMap.forEach(function(item, node) {
        if (_this._nodesToBeRendered.has(node)) {
          _this._nodesToBeRemoved || (_this._nodesToBeRemoved = new Batman.SimpleSet);
          return _this._nodesToBeRemoved.add(node);
        } else {
          return _this._removeItem(item);
        }
      });
    };

    IteratorBinding.prototype._itemForNode = function(node) {
      return Batman._data(node, "" + this.iteratorName + "Item");
    };

    IteratorBinding.prototype._newNodeForItem = function(newItem) {
      var newNode, renderer,
        _this = this;
      newNode = this.prototypeNode.cloneNode(true);
      this._nodesToBeRendered || (this._nodesToBeRendered = new Batman.SimpleSet);
      this._nodesToBeRendered.add(newNode);
      Batman._data(newNode, "" + this.iteratorName + "Item", newItem);
      this.nodeMap.set(newItem, newNode);
      this.parentRenderer.prevent('rendered');
      renderer = new Batman.Renderer(newNode, this.renderContext.descend(newItem, this.iteratorName), this.parentRenderer.view);
      renderer.once('rendered', function() {
        var _ref;
        _this._nodesToBeRendered.remove(newNode);
        if ((_ref = _this._nodesToBeRemoved) != null ? _ref.has(newNode) : void 0) {
          _this._nodesToBeRemoved.remove(newNode);
          _this._removeItem(newItem);
        } else {
          Batman.DOM.propagateBindingEvents(newNode);
          _this.fire('nodeAdded', newNode, newItem);
        }
        return _this.parentRenderer.allowAndFire('rendered');
      });
      return newNode;
    };

    IteratorBinding.prototype._getStartNodeIndex = function() {
      var index, node, _i, _len, _ref;
      _ref = this.parentNode().childNodes;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        node = _ref[index];
        if (node === this.startNode) {
          return index;
        }
      }
      return 0;
    };

    IteratorBinding.prototype._removeItem = function(item) {
      var node;
      node = this.nodeMap.unset(item);
      Batman.DOM.destroyNode(node);
      return this.fire('nodeRemoved', node, item);
    };

    IteratorBinding.prototype.die = function() {
      var _ref;
      if (this._nodesToBeRendered && !this._nodesToBeRendered.isEmpty()) {
        this._nodesToBeRemoved || (this._nodesToBeRemoved = new Batman.SimpleSet);
        (_ref = this._nodesToBeRemoved).add.apply(_ref, this._nodesToBeRendered.toArray());
      }
      return IteratorBinding.__super__.die.apply(this, arguments);
    };

    return IteratorBinding;

  })(Batman.DOM.AbstractCollectionBinding);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.ClassBinding = (function(_super) {

    __extends(ClassBinding, _super);

    function ClassBinding() {
      this.handleArrayChanged = __bind(this.handleArrayChanged, this);
      return ClassBinding.__super__.constructor.apply(this, arguments);
    }

    ClassBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    ClassBinding.prototype.dataChange = function(value) {
      if (value != null) {
        this.unbindCollection();
        if (typeof value === 'string') {
          return this.node.className = value;
        } else {
          this.bindCollection(value);
          return this.updateFromCollection();
        }
      }
    };

    ClassBinding.prototype.updateFromCollection = function() {
      var array, k, v;
      if (this.collection) {
        array = this.collection.map ? this.collection.map(function(x) {
          return x;
        }) : (function() {
          var _ref, _results;
          _ref = this.collection;
          _results = [];
          for (k in _ref) {
            if (!__hasProp.call(_ref, k)) continue;
            v = _ref[k];
            _results.push(k);
          }
          return _results;
        }).call(this);
        if (array.toArray != null) {
          array = array.toArray();
        }
        return this.node.className = array.join(' ');
      }
    };

    ClassBinding.prototype.handleArrayChanged = function() {
      return this.updateFromCollection();
    };

    return ClassBinding;

  })(Batman.DOM.AbstractCollectionBinding);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ValidationError = (function(_super) {

    __extends(ValidationError, _super);

    ValidationError.accessor('fullMessage', function() {
      return Batman.t('errors.format', {
        attribute: Batman.helpers.humanize(this.attribute),
        message: this.message
      });
    });

    function ValidationError(attribute, message) {
      ValidationError.__super__.constructor.call(this, {
        attribute: attribute,
        message: message
      });
    }

    return ValidationError;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.StorageAdapter = (function(_super) {

    __extends(StorageAdapter, _super);

    StorageAdapter.StorageError = (function(_super1) {

      __extends(StorageError, _super1);

      StorageError.prototype.name = "StorageError";

      function StorageError(message) {
        StorageError.__super__.constructor.apply(this, arguments);
        this.message = message;
      }

      return StorageError;

    })(Error);

    StorageAdapter.RecordExistsError = (function(_super1) {

      __extends(RecordExistsError, _super1);

      RecordExistsError.prototype.name = 'RecordExistsError';

      function RecordExistsError(message) {
        RecordExistsError.__super__.constructor.call(this, message || "Can't create this record because it already exists in the store!");
      }

      return RecordExistsError;

    })(StorageAdapter.StorageError);

    StorageAdapter.NotFoundError = (function(_super1) {

      __extends(NotFoundError, _super1);

      NotFoundError.prototype.name = 'NotFoundError';

      function NotFoundError(message) {
        NotFoundError.__super__.constructor.call(this, message || "Record couldn't be found in storage!");
      }

      return NotFoundError;

    })(StorageAdapter.StorageError);

    StorageAdapter.NotAllowedError = (function(_super1) {

      __extends(NotAllowedError, _super1);

      NotAllowedError.prototype.name = "NotAllowedError";

      function NotAllowedError(message) {
        NotAllowedError.__super__.constructor.call(this, message || "Storage operation denied access to the operation!");
      }

      return NotAllowedError;

    })(StorageAdapter.StorageError);

    StorageAdapter.NotAcceptableError = (function(_super1) {

      __extends(NotAcceptableError, _super1);

      NotAcceptableError.prototype.name = "NotAcceptableError";

      function NotAcceptableError(message) {
        NotAcceptableError.__super__.constructor.call(this, message || "Storage operation permitted but the request was malformed!");
      }

      return NotAcceptableError;

    })(StorageAdapter.StorageError);

    StorageAdapter.UnprocessableRecordError = (function(_super1) {

      __extends(UnprocessableRecordError, _super1);

      UnprocessableRecordError.prototype.name = "UnprocessableRecordError";

      function UnprocessableRecordError(message) {
        UnprocessableRecordError.__super__.constructor.call(this, message || "Storage adapter could not process the record!");
      }

      return UnprocessableRecordError;

    })(StorageAdapter.StorageError);

    StorageAdapter.InternalStorageError = (function(_super1) {

      __extends(InternalStorageError, _super1);

      InternalStorageError.prototype.name = "InternalStorageError";

      function InternalStorageError(message) {
        InternalStorageError.__super__.constructor.call(this, message || "An error occured during the storage operation!");
      }

      return InternalStorageError;

    })(StorageAdapter.StorageError);

    StorageAdapter.NotImplementedError = (function(_super1) {

      __extends(NotImplementedError, _super1);

      NotImplementedError.prototype.name = "NotImplementedError";

      function NotImplementedError(message) {
        NotImplementedError.__super__.constructor.call(this, message || "This operation is not implemented by the storage adpater!");
      }

      return NotImplementedError;

    })(StorageAdapter.StorageError);

    function StorageAdapter(model) {
      var constructor;
      StorageAdapter.__super__.constructor.call(this, {
        model: model
      });
      constructor = this.constructor;
      if (constructor.ModelMixin) {
        Batman.extend(model, constructor.ModelMixin);
      }
      if (constructor.RecordMixin) {
        Batman.extend(model.prototype, constructor.RecordMixin);
      }
    }

    StorageAdapter.prototype.isStorageAdapter = true;

    StorageAdapter.prototype.storageKey = function(record) {
      var model;
      model = (record != null ? record.constructor : void 0) || this.model;
      return model.get('storageKey') || Batman.helpers.pluralize(Batman.helpers.underscore(model.get('resourceName')));
    };

    StorageAdapter.prototype.getRecordFromData = function(attributes, constructor) {
      var record;
      if (constructor == null) {
        constructor = this.model;
      }
      record = new constructor();
      record._withoutDirtyTracking(function() {
        return this.fromJSON(attributes);
      });
      return record;
    };

    StorageAdapter.skipIfError = function(f) {
      return function(env, next) {
        if (env.error != null) {
          return next();
        } else {
          return f.call(this, env, next);
        }
      };
    };

    StorageAdapter.prototype.before = function() {
      return this._addFilter.apply(this, ['before'].concat(__slice.call(arguments)));
    };

    StorageAdapter.prototype.after = function() {
      return this._addFilter.apply(this, ['after'].concat(__slice.call(arguments)));
    };

    StorageAdapter.prototype._inheritFilters = function() {
      var filtersByKey, filtersList, key, oldFilters, position, _results;
      if (!this._batman.check(this) || !this._batman.filters) {
        oldFilters = this._batman.getFirst('filters');
        this._batman.filters = {
          before: {},
          after: {}
        };
        if (oldFilters != null) {
          _results = [];
          for (position in oldFilters) {
            filtersByKey = oldFilters[position];
            _results.push((function() {
              var _results1;
              _results1 = [];
              for (key in filtersByKey) {
                filtersList = filtersByKey[key];
                _results1.push(this._batman.filters[position][key] = filtersList.slice(0));
              }
              return _results1;
            }).call(this));
          }
          return _results;
        }
      }
    };

    StorageAdapter.prototype._addFilter = function() {
      var filter, key, keys, position, _base, _i, _j, _len;
      position = arguments[0], keys = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), filter = arguments[_i++];
      this._inheritFilters();
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        (_base = this._batman.filters[position])[key] || (_base[key] = []);
        this._batman.filters[position][key].push(filter);
      }
      return true;
    };

    StorageAdapter.prototype.runFilter = function(position, action, env, callback) {
      var actionFilters, allFilters, filters, next,
        _this = this;
      this._inheritFilters();
      allFilters = this._batman.filters[position].all || [];
      actionFilters = this._batman.filters[position][action] || [];
      env.action = action;
      filters = position === 'before' ? actionFilters.concat(allFilters) : allFilters.concat(actionFilters);
      next = function(newEnv) {
        var nextFilter;
        if (newEnv != null) {
          env = newEnv;
        }
        if ((nextFilter = filters.shift()) != null) {
          return nextFilter.call(_this, env, next);
        } else {
          return callback.call(_this, env);
        }
      };
      return next();
    };

    StorageAdapter.prototype.runBeforeFilter = function() {
      return this.runFilter.apply(this, ['before'].concat(__slice.call(arguments)));
    };

    StorageAdapter.prototype.runAfterFilter = function(action, env, callback) {
      return this.runFilter('after', action, env, this.exportResult(callback));
    };

    StorageAdapter.prototype.exportResult = function(callback) {
      return function(env) {
        return callback(env.error, env.result, env);
      };
    };

    StorageAdapter.prototype._jsonToAttributes = function(json) {
      return JSON.parse(json);
    };

    StorageAdapter.prototype.perform = function(key, subject, options, callback) {
      var env, next,
        _this = this;
      options || (options = {});
      env = {
        options: options,
        subject: subject
      };
      next = function(newEnv) {
        if (newEnv != null) {
          env = newEnv;
        }
        return _this.runAfterFilter(key, env, callback);
      };
      this.runBeforeFilter(key, env, function(env) {
        return this[key](env, next);
      });
      return void 0;
    };

    return StorageAdapter;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Batman.RestStorage = (function(_super) {
    var key, _fn, _i, _len, _ref,
      _this = this;

    __extends(RestStorage, _super);

    RestStorage.CommunicationError = (function(_super1) {

      __extends(CommunicationError, _super1);

      CommunicationError.prototype.name = 'CommunicationError';

      function CommunicationError(message) {
        CommunicationError.__super__.constructor.call(this, message || "A communication error has occurred!");
      }

      return CommunicationError;

    })(RestStorage.StorageError);

    RestStorage.JSONContentType = 'application/json';

    RestStorage.PostBodyContentType = 'application/x-www-form-urlencoded';

    RestStorage.BaseMixin = {
      request: function(action, options, callback) {
        if (!callback) {
          callback = options;
          options = {};
        }
        options.method || (options.method = 'GET');
        options.action = action;
        return this._doStorageOperation(options.method.toLowerCase(), options, callback);
      }
    };

    RestStorage.ModelMixin = Batman.extend({}, RestStorage.BaseMixin, {
      urlNestsUnder: function() {
        var key, keys, parents, _i, _len;
        keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        parents = {};
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          parents[key + '_id'] = Batman.helpers.pluralize(key);
        }
        this.url = function(options) {
          var childSegment, parentID, plural;
          childSegment = Batman.helpers.pluralize(this.get('resourceName').toLowerCase());
          for (key in parents) {
            plural = parents[key];
            parentID = options.data[key];
            if (parentID) {
              delete options.data[key];
              return "" + plural + "/" + parentID + "/" + childSegment;
            }
          }
          return childSegment;
        };
        return this.prototype.url = function() {
          var childSegment, id, parentID, plural, url;
          childSegment = Batman.helpers.pluralize(this.constructor.get('resourceName').toLowerCase());
          for (key in parents) {
            plural = parents[key];
            parentID = this.get('dirtyKeys').get(key);
            if (parentID === void 0) {
              parentID = this.get(key);
            }
            if (parentID) {
              url = "" + plural + "/" + parentID + "/" + childSegment;
              break;
            }
          }
          url || (url = childSegment);
          if (id = this.get('id')) {
            url += '/' + id;
          }
          return url;
        };
      }
    });

    RestStorage.RecordMixin = Batman.extend({}, RestStorage.BaseMixin);

    RestStorage.prototype.defaultRequestOptions = {
      type: 'json'
    };

    RestStorage.prototype._implicitActionNames = ['create', 'read', 'update', 'destroy', 'readAll'];

    RestStorage.prototype.serializeAsForm = true;

    function RestStorage() {
      RestStorage.__super__.constructor.apply(this, arguments);
      this.defaultRequestOptions = Batman.extend({}, this.defaultRequestOptions);
    }

    RestStorage.prototype.recordJsonNamespace = function(record) {
      return Batman.helpers.singularize(this.storageKey(record));
    };

    RestStorage.prototype.collectionJsonNamespace = function(constructor) {
      return Batman.helpers.pluralize(this.storageKey(constructor.prototype));
    };

    RestStorage.prototype._execWithOptions = function(object, key, options, context) {
      if (context == null) {
        context = object;
      }
      if (typeof object[key] === 'function') {
        return object[key].call(context, options);
      } else {
        return object[key];
      }
    };

    RestStorage.prototype._defaultCollectionUrl = function(model) {
      return "" + (this.storageKey(model.prototype));
    };

    RestStorage.prototype._addParams = function(url, options) {
      var _ref;
      if (options && options.action && !(_ref = options.action, __indexOf.call(this._implicitActionNames, _ref) >= 0)) {
        url += '/' + options.action.toLowerCase();
      }
      return url;
    };

    RestStorage.prototype._addUrlAffixes = function(url, subject, env) {
      var prefix, segments;
      segments = [url, this.urlSuffix(subject, env)];
      if (url.charAt(0) !== '/') {
        prefix = this.urlPrefix(subject, env);
        if (prefix.charAt(prefix.length - 1) !== '/') {
          segments.unshift('/');
        }
        segments.unshift(prefix);
      }
      return segments.join('');
    };

    RestStorage.prototype.urlPrefix = function(object, env) {
      return this._execWithOptions(object, 'urlPrefix', env.options) || '';
    };

    RestStorage.prototype.urlSuffix = function(object, env) {
      return this._execWithOptions(object, 'urlSuffix', env.options) || '';
    };

    RestStorage.prototype.urlForRecord = function(record, env) {
      var id, url, _ref;
      if ((_ref = env.options) != null ? _ref.recordUrl : void 0) {
        url = this._execWithOptions(env.options, 'recordUrl', env.options, record);
      } else if (record.url) {
        url = this._execWithOptions(record, 'url', env.options);
      } else {
        url = record.constructor.url ? this._execWithOptions(record.constructor, 'url', env.options) : this._defaultCollectionUrl(record.constructor);
        if (env.action !== 'create') {
          if ((id = record.get('id')) != null) {
            url = url + "/" + id;
          } else {
            throw new this.constructor.StorageError("Couldn't get/set record primary key on " + env.action + "!");
          }
        }
      }
      return this._addUrlAffixes(this._addParams(url, env.options), record, env);
    };

    RestStorage.prototype.urlForCollection = function(model, env) {
      var url, _ref;
      url = ((_ref = env.options) != null ? _ref.collectionUrl : void 0) ? this._execWithOptions(env.options, 'collectionUrl', env.options, env.options.urlContext) : model.url ? this._execWithOptions(model, 'url', env.options) : this._defaultCollectionUrl(model, env.options);
      return this._addUrlAffixes(this._addParams(url, env.options), model, env);
    };

    RestStorage.prototype.request = function(env, next) {
      var options;
      options = Batman.extend(env.options, {
        autosend: false,
        success: function(data) {
          return env.data = data;
        },
        error: function(error) {
          return env.error = error;
        },
        loaded: function() {
          env.response = env.request.get('response');
          return next();
        }
      });
      env.request = new Batman.Request(options);
      return env.request.send();
    };

    RestStorage.prototype.perform = function(key, record, options, callback) {
      options || (options = {});
      Batman.extend(options, this.defaultRequestOptions);
      return RestStorage.__super__.perform.call(this, key, record, options, callback);
    };

    RestStorage.prototype.before('all', RestStorage.skipIfError(function(env, next) {
      if (!env.options.url) {
        try {
          env.options.url = env.subject.prototype ? this.urlForCollection(env.subject, env) : this.urlForRecord(env.subject, env);
        } catch (error) {
          env.error = error;
        }
      }
      return next();
    }));

    RestStorage.prototype.before('get', 'put', 'post', 'delete', RestStorage.skipIfError(function(env, next) {
      env.options.method = env.action.toUpperCase();
      return next();
    }));

    RestStorage.prototype.before('create', 'update', RestStorage.skipIfError(function(env, next) {
      var data, json, namespace;
      json = env.subject.toJSON();
      if (namespace = this.recordJsonNamespace(env.subject)) {
        data = {};
        data[namespace] = json;
      } else {
        data = json;
      }
      env.options.data = data;
      return next();
    }));

    RestStorage.prototype.before('create', 'update', 'put', 'post', RestStorage.skipIfError(function(env, next) {
      if (this.serializeAsForm) {
        env.options.contentType = this.constructor.PostBodyContentType;
      } else {
        if (env.options.data != null) {
          env.options.data = JSON.stringify(env.options.data);
          env.options.contentType = this.constructor.JSONContentType;
        }
      }
      return next();
    }));

    RestStorage.prototype.after('all', RestStorage.skipIfError(function(env, next) {
      var json;
      if (!(env.data != null)) {
        return next();
      }
      if (typeof env.data === 'string') {
        if (env.data.length > 0) {
          try {
            json = this._jsonToAttributes(env.data);
          } catch (error) {
            env.error = error;
            return next();
          }
        }
      } else if (typeof env.data === 'object') {
        json = env.data;
      }
      if (json != null) {
        env.json = json;
      }
      return next();
    }));

    RestStorage.prototype.extractFromNamespace = function(data, namespace) {
      if (namespace && (data[namespace] != null)) {
        return data[namespace];
      } else {
        return data;
      }
    };

    RestStorage.prototype.after('create', 'read', 'update', RestStorage.skipIfError(function(env, next) {
      var json;
      if (env.json != null) {
        json = this.extractFromNamespace(env.json, this.recordJsonNamespace(env.subject));
        env.subject._withoutDirtyTracking(function() {
          return this.fromJSON(json);
        });
      }
      env.result = env.subject;
      return next();
    }));

    RestStorage.prototype.after('readAll', RestStorage.skipIfError(function(env, next) {
      var jsonRecordAttributes, namespace;
      namespace = this.collectionJsonNamespace(env.subject);
      env.recordsAttributes = this.extractFromNamespace(env.json, namespace);
      if (Batman.typeOf(env.recordsAttributes) !== 'Array') {
        namespace = this.recordJsonNamespace(env.subject.prototype);
        env.recordsAttributes = [this.extractFromNamespace(env.json, namespace)];
      }
      env.result = env.records = (function() {
        var _i, _len, _ref, _results;
        _ref = env.recordsAttributes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          jsonRecordAttributes = _ref[_i];
          _results.push(this.getRecordFromData(jsonRecordAttributes, env.subject));
        }
        return _results;
      }).call(this);
      return next();
    }));

    RestStorage.prototype.after('get', 'put', 'post', 'delete', RestStorage.skipIfError(function(env, next) {
      var json, namespace;
      if (env.json != null) {
        json = env.json;
        namespace = env.subject.prototype ? this.collectionJsonNamespace(env.subject) : this.recordJsonNamespace(env.subject);
        env.result = namespace && (env.json[namespace] != null) ? env.json[namespace] : env.json;
      }
      return next();
    }));

    RestStorage.HTTPMethods = {
      create: 'POST',
      update: 'PUT',
      read: 'GET',
      readAll: 'GET',
      destroy: 'DELETE'
    };

    _ref = ['create', 'read', 'update', 'destroy', 'readAll', 'get', 'post', 'put', 'delete'];
    _fn = function(key) {
      return RestStorage.prototype[key] = RestStorage.skipIfError(function(env, next) {
        var _base;
        (_base = env.options).method || (_base.method = this.constructor.HTTPMethods[key]);
        return this.request(env, next);
      });
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _fn(key);
    }

    RestStorage.prototype.after('all', function(env, next) {
      if (env.error) {
        env.error = this._errorFor(env.error, env);
      }
      return next();
    });

    RestStorage._statusCodeErrors = {
      '0': RestStorage.CommunicationError,
      '403': RestStorage.NotAllowedError,
      '404': RestStorage.NotFoundError,
      '406': RestStorage.NotAcceptableError,
      '409': RestStorage.RecordExistsError,
      '422': RestStorage.UnprocessableRecordError,
      '500': RestStorage.InternalStorageError,
      '501': RestStorage.NotImplementedError
    };

    RestStorage.prototype._errorFor = function(error, env) {
      var errorClass, request;
      if (error instanceof Error || !(error.request != null)) {
        return error;
      }
      if (errorClass = this.constructor._statusCodeErrors[error.request.status]) {
        request = error.request;
        error = new errorClass;
        error.request = request;
        error.env = env;
      }
      return error;
    };

    return RestStorage;

  }).call(this, Batman.StorageAdapter);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.LocalStorage = (function(_super) {

    __extends(LocalStorage, _super);

    function LocalStorage() {
      if (typeof window.localStorage === 'undefined') {
        return null;
      }
      LocalStorage.__super__.constructor.apply(this, arguments);
      this.storage = localStorage;
    }

    LocalStorage.prototype.storageRegExpForRecord = function(record) {
      return new RegExp("^" + (this.storageKey(record)) + "(\\d+)$");
    };

    LocalStorage.prototype.nextIdForRecord = function(record) {
      var nextId, re;
      re = this.storageRegExpForRecord(record);
      nextId = 1;
      this._forAllStorageEntries(function(k, v) {
        var matches;
        if (matches = re.exec(k)) {
          return nextId = Math.max(nextId, parseInt(matches[1], 10) + 1);
        }
      });
      return nextId;
    };

    LocalStorage.prototype._forAllStorageEntries = function(iterator) {
      var i, key, _i, _ref;
      for (i = _i = 0, _ref = this.storage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        key = this.storage.key(i);
        iterator.call(this, key, this.storage.getItem(key));
      }
      return true;
    };

    LocalStorage.prototype._storageEntriesMatching = function(constructor, options) {
      var re, records;
      re = this.storageRegExpForRecord(constructor.prototype);
      records = [];
      this._forAllStorageEntries(function(storageKey, storageString) {
        var data, keyMatches;
        if (keyMatches = re.exec(storageKey)) {
          data = this._jsonToAttributes(storageString);
          data[constructor.primaryKey] = keyMatches[1];
          if (this._dataMatches(options, data)) {
            return records.push(data);
          }
        }
      });
      return records;
    };

    LocalStorage.prototype._dataMatches = function(conditions, data) {
      var k, match, v;
      match = true;
      for (k in conditions) {
        v = conditions[k];
        if (data[k] !== v) {
          match = false;
          break;
        }
      }
      return match;
    };

    LocalStorage.prototype.before('read', 'create', 'update', 'destroy', LocalStorage.skipIfError(function(env, next) {
      var _this = this;
      if (env.action === 'create') {
        env.id = env.subject.get('id') || env.subject._withoutDirtyTracking(function() {
          return env.subject.set('id', _this.nextIdForRecord(env.subject));
        });
      } else {
        env.id = env.subject.get('id');
      }
      if (env.id == null) {
        env.error = new this.constructor.StorageError("Couldn't get/set record primary key on " + env.action + "!");
      } else {
        env.key = this.storageKey(env.subject) + env.id;
      }
      return next();
    }));

    LocalStorage.prototype.before('create', 'update', LocalStorage.skipIfError(function(env, next) {
      env.recordAttributes = JSON.stringify(env.subject);
      return next();
    }));

    LocalStorage.prototype.after('read', LocalStorage.skipIfError(function(env, next) {
      if (typeof env.recordAttributes === 'string') {
        try {
          env.recordAttributes = this._jsonToAttributes(env.recordAttributes);
        } catch (error) {
          env.error = error;
          return next();
        }
      }
      env.subject._withoutDirtyTracking(function() {
        return this.fromJSON(env.recordAttributes);
      });
      return next();
    }));

    LocalStorage.prototype.after('read', 'create', 'update', 'destroy', LocalStorage.skipIfError(function(env, next) {
      env.result = env.subject;
      return next();
    }));

    LocalStorage.prototype.after('readAll', LocalStorage.skipIfError(function(env, next) {
      var recordAttributes;
      env.result = env.records = (function() {
        var _i, _len, _ref, _results;
        _ref = env.recordsAttributes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          recordAttributes = _ref[_i];
          _results.push(this.getRecordFromData(recordAttributes, env.subject));
        }
        return _results;
      }).call(this);
      return next();
    }));

    LocalStorage.prototype.read = LocalStorage.skipIfError(function(env, next) {
      env.recordAttributes = this.storage.getItem(env.key);
      if (!env.recordAttributes) {
        env.error = new this.constructor.NotFoundError();
      }
      return next();
    });

    LocalStorage.prototype.create = LocalStorage.skipIfError(function(_arg, next) {
      var key, recordAttributes;
      key = _arg.key, recordAttributes = _arg.recordAttributes;
      if (this.storage.getItem(key)) {
        arguments[0].error = new this.constructor.RecordExistsError;
      } else {
        this.storage.setItem(key, recordAttributes);
      }
      return next();
    });

    LocalStorage.prototype.update = LocalStorage.skipIfError(function(_arg, next) {
      var key, recordAttributes;
      key = _arg.key, recordAttributes = _arg.recordAttributes;
      this.storage.setItem(key, recordAttributes);
      return next();
    });

    LocalStorage.prototype.destroy = LocalStorage.skipIfError(function(_arg, next) {
      var key;
      key = _arg.key;
      this.storage.removeItem(key);
      return next();
    });

    LocalStorage.prototype.readAll = LocalStorage.skipIfError(function(env, next) {
      try {
        arguments[0].recordsAttributes = this._storageEntriesMatching(env.subject, env.options.data);
      } catch (error) {
        arguments[0].error = error;
      }
      return next();
    });

    return LocalStorage;

  })(Batman.StorageAdapter);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.SessionStorage = (function(_super) {

    __extends(SessionStorage, _super);

    function SessionStorage() {
      if (typeof window.sessionStorage === 'undefined') {
        return null;
      }
      SessionStorage.__super__.constructor.apply(this, arguments);
      this.storage = sessionStorage;
    }

    return SessionStorage;

  })(Batman.LocalStorage);

}).call(this);

(function() {

  Batman.Encoders = new Batman.Object;

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ParamsReplacer = (function(_super) {

    __extends(ParamsReplacer, _super);

    function ParamsReplacer(navigator, params) {
      this.navigator = navigator;
      this.params = params;
    }

    ParamsReplacer.prototype.redirect = function() {
      return this.navigator.replace(this.toObject());
    };

    ParamsReplacer.prototype.replace = function(params) {
      this.params.replace(params);
      return this.redirect();
    };

    ParamsReplacer.prototype.update = function(params) {
      this.params.update(params);
      return this.redirect();
    };

    ParamsReplacer.prototype.clear = function() {
      this.params.clear();
      return this.redirect();
    };

    ParamsReplacer.prototype.toObject = function() {
      return this.params.toObject();
    };

    ParamsReplacer.accessor({
      get: function(k) {
        return this.params.get(k);
      },
      set: function(k, v) {
        var oldValue, result;
        oldValue = this.params.get(k);
        result = this.params.set(k, v);
        if (oldValue !== v) {
          this.redirect();
        }
        return result;
      },
      unset: function(k) {
        var hadKey, result;
        hadKey = this.params.hasKey(k);
        result = this.params.unset(k);
        if (hadKey) {
          this.redirect();
        }
        return result;
      }
    });

    return ParamsReplacer;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ParamsPusher = (function(_super) {

    __extends(ParamsPusher, _super);

    function ParamsPusher() {
      return ParamsPusher.__super__.constructor.apply(this, arguments);
    }

    ParamsPusher.prototype.redirect = function() {
      return this.navigator.push(this.toObject());
    };

    return ParamsPusher;

  })(Batman.ParamsReplacer);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.NamedRouteQuery = (function(_super) {

    __extends(NamedRouteQuery, _super);

    NamedRouteQuery.prototype.isNamedRouteQuery = true;

    function NamedRouteQuery(routeMap, args) {
      var key;
      if (args == null) {
        args = [];
      }
      NamedRouteQuery.__super__.constructor.call(this, {
        routeMap: routeMap,
        args: args
      });
      for (key in this.get('routeMap').childrenByName) {
        this[key] = this._queryAccess.bind(this, key);
      }
    }

    NamedRouteQuery.accessor('route', function() {
      var collectionRoute, memberRoute, route, _i, _len, _ref, _ref1;
      _ref = this.get('routeMap'), memberRoute = _ref.memberRoute, collectionRoute = _ref.collectionRoute;
      _ref1 = [memberRoute, collectionRoute];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        route = _ref1[_i];
        if (route != null) {
          if (route.namedArguments.length === this.get('args').length) {
            return route;
          }
        }
      }
      return collectionRoute || memberRoute;
    });

    NamedRouteQuery.accessor('path', function() {
      return this.path();
    });

    NamedRouteQuery.accessor('routeMap', 'args', 'cardinality', 'hashValue', Batman.Property.defaultAccessor);

    NamedRouteQuery.accessor({
      get: function(key) {
        if (key == null) {
          return;
        }
        if (typeof key === 'string') {
          return this.nextQueryForName(key);
        } else {
          return this.nextQueryWithArgument(key);
        }
      },
      cache: false
    });

    NamedRouteQuery.accessor('withHash', function() {
      var _this = this;
      return new Batman.Accessible(function(hashValue) {
        return _this.withHash(hashValue);
      });
    });

    NamedRouteQuery.prototype.withHash = function(hashValue) {
      var clone;
      clone = this.clone();
      clone.set('hashValue', hashValue);
      return clone;
    };

    NamedRouteQuery.prototype.nextQueryForName = function(key) {
      var map;
      if (map = this.get('routeMap').childrenByName[key]) {
        return new Batman.NamedRouteQuery(map, this.args);
      } else {
        return Batman.developer.error("Couldn't find a route for the name " + key + "!");
      }
    };

    NamedRouteQuery.prototype.nextQueryWithArgument = function(arg) {
      var args;
      args = this.args.slice(0);
      args.push(arg);
      return this.clone(args);
    };

    NamedRouteQuery.prototype.path = function() {
      var argumentName, argumentValue, index, namedArguments, params, _i, _len;
      params = {};
      namedArguments = this.get('route.namedArguments');
      for (index = _i = 0, _len = namedArguments.length; _i < _len; index = ++_i) {
        argumentName = namedArguments[index];
        if ((argumentValue = this.get('args')[index]) != null) {
          params[argumentName] = this._toParam(argumentValue);
        }
      }
      if (this.get('hashValue') != null) {
        params['#'] = this.get('hashValue');
      }
      return this.get('route').pathFromParams(params);
    };

    NamedRouteQuery.prototype.toString = function() {
      return this.path();
    };

    NamedRouteQuery.prototype.clone = function(args) {
      if (args == null) {
        args = this.args;
      }
      return new Batman.NamedRouteQuery(this.routeMap, args);
    };

    NamedRouteQuery.prototype._toParam = function(arg) {
      if (arg instanceof Batman.AssociationProxy) {
        arg = arg.get('target');
      }
      if ((arg != null ? arg.toParam : void 0) != null) {
        return arg.toParam();
      } else {
        return arg;
      }
    };

    NamedRouteQuery.prototype._queryAccess = function(key, arg) {
      var query;
      query = this.nextQueryForName(key);
      if (arg != null) {
        query = query.nextQueryWithArgument(arg);
      }
      return query;
    };

    return NamedRouteQuery;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Dispatcher = (function(_super) {
    var ControllerDirectory;

    __extends(Dispatcher, _super);

    Dispatcher.canInferRoute = function(argument) {
      return argument instanceof Batman.Model || argument instanceof Batman.AssociationProxy || argument.prototype instanceof Batman.Model;
    };

    Dispatcher.paramsFromArgument = function(argument) {
      var resourceNameFromModel;
      resourceNameFromModel = function(model) {
        return Batman.helpers.camelize(Batman.helpers.pluralize(model.get('resourceName')), true);
      };
      if (!this.canInferRoute(argument)) {
        return argument;
      }
      if (argument instanceof Batman.Model || argument instanceof Batman.AssociationProxy) {
        if (argument.isProxy) {
          argument = argument.get('target');
        }
        if (argument != null) {
          return {
            controller: resourceNameFromModel(argument.constructor),
            action: 'show',
            id: argument.get('id')
          };
        } else {
          return {};
        }
      } else if (argument.prototype instanceof Batman.Model) {
        return {
          controller: resourceNameFromModel(argument),
          action: 'index'
        };
      } else {
        return argument;
      }
    };

    ControllerDirectory = (function(_super1) {

      __extends(ControllerDirectory, _super1);

      function ControllerDirectory() {
        return ControllerDirectory.__super__.constructor.apply(this, arguments);
      }

      ControllerDirectory.accessor('__app', Batman.Property.defaultAccessor);

      ControllerDirectory.accessor(function(key) {
        return this.get("__app." + (Batman.helpers.capitalize(key)) + "Controller.sharedController");
      });

      return ControllerDirectory;

    })(Batman.Object);

    Dispatcher.accessor('controllers', function() {
      return new ControllerDirectory({
        __app: this.get('app')
      });
    });

    function Dispatcher(app, routeMap) {
      Dispatcher.__super__.constructor.call(this, {
        app: app,
        routeMap: routeMap
      });
    }

    Dispatcher.prototype.routeForParams = function(params) {
      params = this.constructor.paramsFromArgument(params);
      return this.get('routeMap').routeForParams(params);
    };

    Dispatcher.prototype.pathFromParams = function(params) {
      var _ref;
      if (typeof params === 'string') {
        return params;
      }
      params = this.constructor.paramsFromArgument(params);
      return (_ref = this.routeForParams(params)) != null ? _ref.pathFromParams(params) : void 0;
    };

    Dispatcher.prototype.dispatch = function(params) {
      var error, inferredParams, path, route, _ref, _ref1;
      inferredParams = this.constructor.paramsFromArgument(params);
      route = this.routeForParams(inferredParams);
      if (route) {
        _ref = route.pathAndParamsFromArgument(inferredParams), path = _ref[0], params = _ref[1];
        this.set('app.currentRoute', route);
        this.set('app.currentURL', path);
        this.get('app.currentParams').replace(params || {});
        route.dispatch(params);
      } else {
        if (Batman.typeOf(params) === 'Object' && !this.constructor.canInferRoute(params)) {
          return this.get('app.currentParams').replace(params);
        } else {
          this.get('app.currentParams').clear();
        }
        error = {
          type: '404',
          isPrevented: false,
          preventDefault: function() {
            return this.isPrevented = true;
          }
        };
        if ((_ref1 = Batman.currentApp) != null) {
          _ref1.fire('error', error);
        }
        if (error.isPrevented) {
          return params;
        }
        if (params !== '/404') {
          return Batman.redirect('/404');
        }
      }
      return path;
    };

    return Dispatcher;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Route = (function(_super) {

    __extends(Route, _super);

    Route.regexps = {
      namedParam: /:([\w\d]+)/g,
      splatParam: /\*([\w\d]+)/g,
      queryParam: '(?:\\?.+)?',
      namedOrSplat: /[:|\*]([\w\d]+)/g,
      namePrefix: '[:|\*]',
      escapeRegExp: /[-[\]{}+?.,\\^$|#\s]/g,
      openOptParam: /\(/g,
      closeOptParam: /\)/g
    };

    Route.prototype.optionKeys = ['member', 'collection'];

    Route.prototype.testKeys = ['controller', 'action'];

    Route.prototype.isRoute = true;

    function Route(templatePath, baseParams) {
      var k, matches, namedArguments, pattern, properties, regexp, regexps, _i, _len, _ref;
      regexps = this.constructor.regexps;
      if (templatePath.indexOf('/') !== 0) {
        templatePath = "/" + templatePath;
      }
      pattern = templatePath.replace(regexps.escapeRegExp, '\\$&');
      regexp = RegExp("^" + (pattern.replace(regexps.openOptParam, '(?:').replace(regexps.closeOptParam, ')?').replace(regexps.namedParam, '([^\/]+)').replace(regexps.splatParam, '(.*?)')) + regexps.queryParam + "$");
      regexps.namedOrSplat.lastIndex = 0;
      namedArguments = ((function() {
        var _results;
        _results = [];
        while (matches = regexps.namedOrSplat.exec(pattern)) {
          _results.push(matches[1]);
        }
        return _results;
      })());
      properties = {
        templatePath: templatePath,
        pattern: pattern,
        regexp: regexp,
        namedArguments: namedArguments,
        baseParams: baseParams
      };
      _ref = this.optionKeys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        properties[k] = baseParams[k];
        delete baseParams[k];
      }
      Route.__super__.constructor.call(this, properties);
    }

    Route.prototype.paramsFromPath = function(pathAndQuery) {
      var index, match, matches, name, namedArguments, params, uri, _i, _len;
      uri = new Batman.URI(pathAndQuery);
      namedArguments = this.get('namedArguments');
      params = Batman.extend({
        path: uri.path
      }, this.get('baseParams'));
      matches = this.get('regexp').exec(uri.path).slice(1);
      for (index = _i = 0, _len = matches.length; _i < _len; index = ++_i) {
        match = matches[index];
        name = namedArguments[index];
        params[name] = match;
      }
      return Batman.extend(params, uri.queryParams);
    };

    Route.prototype.pathFromParams = function(argumentParams) {
      var hash, key, name, newPath, params, path, query, regexp, regexps, _i, _j, _len, _len1, _ref, _ref1;
      params = Batman.extend({}, argumentParams);
      path = this.get('templatePath');
      regexps = this.constructor.regexps;
      _ref = this.get('namedArguments');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        regexp = RegExp("" + regexps.namePrefix + name);
        newPath = path.replace(regexp, (params[name] != null ? params[name] : ''));
        if (newPath !== path) {
          delete params[name];
          path = newPath;
        }
      }
      path = path.replace(regexps.openOptParam, '').replace(regexps.closeOptParam, '').replace(/([^\/])\/+$/, '$1');
      _ref1 = this.testKeys;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        key = _ref1[_j];
        delete params[key];
      }
      if (params['#']) {
        hash = params['#'];
        delete params['#'];
      }
      query = Batman.URI.queryFromParams(params);
      if (query) {
        path += "?" + query;
      }
      if (hash) {
        path += "#" + hash;
      }
      return path;
    };

    Route.prototype.test = function(pathOrParams) {
      var key, path, value, _i, _len, _ref;
      if (typeof pathOrParams === 'string') {
        path = pathOrParams;
      } else if (pathOrParams.path != null) {
        path = pathOrParams.path;
      } else {
        path = this.pathFromParams(pathOrParams);
        _ref = this.testKeys;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          if ((value = this.get(key)) != null) {
            if (pathOrParams[key] !== value) {
              return false;
            }
          }
        }
      }
      return this.get('regexp').test(path);
    };

    Route.prototype.pathAndParamsFromArgument = function(pathOrParams) {
      var params, path;
      if (typeof pathOrParams === 'string') {
        params = this.paramsFromPath(pathOrParams);
        path = pathOrParams;
      } else {
        params = pathOrParams;
        path = this.pathFromParams(pathOrParams);
      }
      return [path, params];
    };

    Route.prototype.dispatch = function(params) {
      if (!this.test(params)) {
        return false;
      }
      return this.get('callback')(params);
    };

    Route.prototype.callback = function() {
      throw new Batman.DevelopmentError("Override callback in a Route subclass");
    };

    return Route;

  })(Batman.Object);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ControllerActionRoute = (function(_super) {

    __extends(ControllerActionRoute, _super);

    ControllerActionRoute.prototype.optionKeys = ['member', 'collection', 'app', 'controller', 'action'];

    function ControllerActionRoute(templatePath, options) {
      this.callback = __bind(this.callback, this);

      var action, controller, _ref;
      if (options.signature) {
        _ref = options.signature.split('#'), controller = _ref[0], action = _ref[1];
        action || (action = 'index');
        options.controller = controller;
        options.action = action;
        delete options.signature;
      }
      ControllerActionRoute.__super__.constructor.call(this, templatePath, options);
    }

    ControllerActionRoute.prototype.callback = function(params) {
      var controller;
      controller = this.get("app.dispatcher.controllers." + (this.get('controller')));
      return controller.dispatch(this.get('action'), params);
    };

    return ControllerActionRoute;

  })(Batman.Route);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.CallbackActionRoute = (function(_super) {

    __extends(CallbackActionRoute, _super);

    function CallbackActionRoute() {
      return CallbackActionRoute.__super__.constructor.apply(this, arguments);
    }

    CallbackActionRoute.prototype.optionKeys = ['member', 'collection', 'callback', 'app'];

    CallbackActionRoute.prototype.controller = false;

    CallbackActionRoute.prototype.action = false;

    return CallbackActionRoute;

  })(Batman.Route);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.Hash = (function(_super) {
    var k, _fn, _i, _j, _len, _len1, _ref, _ref1,
      _this = this;

    __extends(Hash, _super);

    Hash.Metadata = (function(_super1) {

      __extends(Metadata, _super1);

      Batman.extend(Metadata.prototype, Batman.Enumerable);

      function Metadata(hash) {
        this.hash = hash;
      }

      Metadata.accessor('length', function() {
        this.hash.registerAsMutableSource();
        return this.hash.length;
      });

      Metadata.accessor('isEmpty', 'keys', 'toArray', function(key) {
        this.hash.registerAsMutableSource();
        return this.hash[key]();
      });

      Metadata.prototype.forEach = function() {
        var _ref;
        return (_ref = this.hash).forEach.apply(_ref, arguments);
      };

      return Metadata;

    })(Batman.Object);

    function Hash() {
      this.meta = new this.constructor.Metadata(this);
      Batman.SimpleHash.apply(this, arguments);
      Hash.__super__.constructor.apply(this, arguments);
    }

    Batman.extend(Hash.prototype, Batman.Enumerable);

    Hash.prototype.propertyClass = Batman.Property;

    Hash.defaultAccessor = {
      get: Batman.SimpleHash.prototype.get,
      set: Hash.mutation(function(key, value) {
        var result;
        result = Batman.SimpleHash.prototype.set.call(this, key, value);
        this.fire('itemsWereAdded', key);
        return result;
      }),
      unset: Hash.mutation(function(key) {
        var result;
        result = Batman.SimpleHash.prototype.unset.call(this, key);
        if (result != null) {
          this.fire('itemsWereRemoved', key);
        }
        return result;
      }),
      cache: false
    };

    Hash.accessor(Hash.defaultAccessor);

    Hash.prototype._preventMutationEvents = function(block) {
      this.prevent('change');
      this.prevent('itemsWereAdded');
      this.prevent('itemsWereRemoved');
      try {
        return block.call(this);
      } finally {
        this.allow('change');
        this.allow('itemsWereAdded');
        this.allow('itemsWereRemoved');
      }
    };

    Hash.prototype.clear = Hash.mutation(function() {
      var keys, result;
      keys = this.keys();
      this._preventMutationEvents(function() {
        var _this = this;
        return this.forEach(function(k) {
          return _this.unset(k);
        });
      });
      result = Batman.SimpleHash.prototype.clear.call(this);
      this.fire.apply(this, ['itemsWereRemoved'].concat(__slice.call(keys)));
      return result;
    });

    Hash.prototype.update = Hash.mutation(function(object) {
      var addedKeys;
      addedKeys = [];
      this._preventMutationEvents(function() {
        var _this = this;
        return Batman.forEach(object, function(k, v) {
          if (!_this.hasKey(k)) {
            addedKeys.push(k);
          }
          return _this.set(k, v);
        });
      });
      if (addedKeys.length > 0) {
        return this.fire.apply(this, ['itemsWereAdded'].concat(__slice.call(addedKeys)));
      }
    });

    Hash.prototype.replace = Hash.mutation(function(object) {
      var addedKeys, removedKeys;
      addedKeys = [];
      removedKeys = [];
      this._preventMutationEvents(function() {
        var _this = this;
        this.forEach(function(k, _) {
          if (!Batman.objectHasKey(object, k)) {
            _this.unset(k);
            return removedKeys.push(k);
          }
        });
        return Batman.forEach(object, function(k, v) {
          if (!_this.hasKey(k)) {
            addedKeys.push(k);
          }
          return _this.set(k, v);
        });
      });
      if (addedKeys.length > 0) {
        this.fire.apply(this, ['itemsWereAdded'].concat(__slice.call(addedKeys)));
      }
      if (removedKeys.length > 0) {
        return this.fire.apply(this, ['itemsWereRemoved'].concat(__slice.call(removedKeys)));
      }
    });

    _ref = ['equality', 'hashKeyFor', 'objectKey', 'prefixedKey', 'unprefixedKey'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      Hash.prototype[k] = Batman.SimpleHash.prototype[k];
    }

    _ref1 = ['hasKey', 'forEach', 'isEmpty', 'keys', 'toArray', 'merge', 'toJSON', 'toObject'];
    _fn = function(k) {
      return Hash.prototype[k] = function() {
        this.registerAsMutableSource();
        return Batman.SimpleHash.prototype[k].apply(this, arguments);
      };
    };
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      k = _ref1[_j];
      _fn(k);
    }

    return Hash;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.RenderCache = (function(_super) {

    __extends(RenderCache, _super);

    RenderCache.prototype.maximumLength = 4;

    function RenderCache() {
      RenderCache.__super__.constructor.apply(this, arguments);
      this.keyQueue = [];
    }

    RenderCache.prototype.viewForOptions = function(options) {
      var _this = this;
      if (options.cache === false || options.viewClass.prototype.cache === false) {
        return this._newViewFromOptions(options);
      }
      return this.getOrSet(options, function() {
        return _this._newViewFromOptions(Batman.extend({}, options));
      });
    };

    RenderCache.prototype._newViewFromOptions = function(options) {
      return new options.viewClass(options);
    };

    RenderCache.wrapAccessor(function(core) {
      return {
        cache: false,
        get: function(key) {
          var result;
          result = core.get.call(this, key);
          if (result) {
            this._addOrBubbleKey(key);
          }
          return result;
        },
        set: function(key, value) {
          var result;
          result = core.set.apply(this, arguments);
          result.set('cached', true);
          this._addOrBubbleKey(key);
          this._evictExpiredKeys();
          return result;
        },
        unset: function(key) {
          var result;
          result = core.unset.apply(this, arguments);
          result.set('cached', false);
          this._removeKeyFromQueue(key);
          return result;
        }
      };
    });

    RenderCache.prototype.equality = function(incomingOptions, storageOptions) {
      var key;
      if (Object.keys(incomingOptions).length !== Object.keys(storageOptions).length) {
        return false;
      }
      for (key in incomingOptions) {
        if (!(key === 'view')) {
          if (incomingOptions[key] !== storageOptions[key]) {
            return false;
          }
        }
      }
      return true;
    };

    RenderCache.prototype.reset = function() {
      var key, _i, _len, _ref, _results;
      _ref = this.keyQueue.slice(0);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(this.unset(key));
      }
      return _results;
    };

    RenderCache.prototype._addOrBubbleKey = function(key) {
      this._removeKeyFromQueue(key);
      return this.keyQueue.unshift(key);
    };

    RenderCache.prototype._removeKeyFromQueue = function(key) {
      var index, queuedKey, _i, _len, _ref;
      _ref = this.keyQueue;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        queuedKey = _ref[index];
        if (this.equality(queuedKey, key)) {
          this.keyQueue.splice(index, 1);
          break;
        }
      }
      return key;
    };

    RenderCache.prototype._evictExpiredKeys = function() {
      var currentKeys, i, key, _i, _ref, _ref1;
      if (this.length > this.maximumLength) {
        currentKeys = this.keyQueue.slice(0);
        for (i = _i = _ref = this.maximumLength, _ref1 = currentKeys.length; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          key = currentKeys[i];
          if (!this.get(key).isInDOM()) {
            this.unset(key);
          }
        }
      }
    };

    return RenderCache;

  })(Batman.Hash);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Batman.Controller = (function(_super) {
    var _optionsFromFilterArguments;

    __extends(Controller, _super);

    Controller.singleton('sharedController');

    Controller.wrapAccessor('routingKey', function(core) {
      return {
        get: function() {
          if (this.routingKey != null) {
            return this.routingKey;
          } else {
            if (Batman.config.minificationErrors) {
              Batman.developer.error("Please define `routingKey` on the prototype of " + (Batman.functionName(this.constructor)) + " in order for your controller to be minification safe.");
            }
            return Batman.functionName(this.constructor).replace(/Controller$/, '');
          }
        }
      };
    });

    Controller.accessor('_renderContext', function() {
      return Batman.RenderContext.root().descend(this);
    });

    _optionsFromFilterArguments = function(options, nameOrFunction) {
      if (!nameOrFunction) {
        nameOrFunction = options;
        options = {};
      } else {
        if (typeof options === 'string') {
          options = {
            only: [options]
          };
        } else {
          if (options.only && Batman.typeOf(options.only) !== 'Array') {
            options.only = [options.only];
          }
          if (options.except && Batman.typeOf(options.except) !== 'Array') {
            options.except = [options.except];
          }
        }
      }
      options.block = nameOrFunction;
      return options;
    };

    Controller.beforeFilter = function() {
      var filters, options, _base;
      Batman.initializeObject(this);
      options = _optionsFromFilterArguments.apply(null, arguments);
      filters = (_base = this._batman).beforeFilters || (_base.beforeFilters = []);
      return filters.push(options);
    };

    Controller.afterFilter = function() {
      var filters, options, _base;
      Batman.initializeObject(this);
      options = _optionsFromFilterArguments.apply(null, arguments);
      filters = (_base = this._batman).afterFilters || (_base.afterFilters = []);
      return filters.push(options);
    };

    Controller.afterFilter(function(params) {
      if (this.autoScrollToHash && (params['#'] != null)) {
        return this.scrollToHash(params['#']);
      }
    });

    Controller.catchError = function() {
      var currentHandlers, error, errors, handlers, options, _base, _i, _j, _len, _results;
      errors = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), options = arguments[_i++];
      Batman.initializeObject(this);
      (_base = this._batman).errorHandlers || (_base.errorHandlers = new Batman.SimpleHash);
      handlers = Batman.typeOf(options["with"]) === 'Array' ? options["with"] : [options["with"]];
      _results = [];
      for (_j = 0, _len = errors.length; _j < _len; _j++) {
        error = errors[_j];
        currentHandlers = this._batman.errorHandlers.get(error) || [];
        _results.push(this._batman.errorHandlers.set(error, currentHandlers.concat(handlers)));
      }
      return _results;
    };

    Controller.prototype.errorHandler = function(callback) {
      var errorFrame, _ref,
        _this = this;
      errorFrame = (_ref = this._actionFrames) != null ? _ref[this._actionFrames.length - 1] : void 0;
      return function(err, result, env) {
        if (err) {
          if (errorFrame != null ? errorFrame.error : void 0) {
            return;
          }
          if (errorFrame != null) {
            errorFrame.error = err;
          }
          if (!_this.handleError(err)) {
            throw err;
          }
        } else {
          return typeof callback === "function" ? callback(result, env) : void 0;
        }
      };
    };

    Controller.prototype.handleError = function(error) {
      var handled, _ref,
        _this = this;
      handled = false;
      if ((_ref = this.constructor._batman.getAll('errorHandlers')) != null) {
        _ref.forEach(function(hash) {
          return hash.forEach(function(key, value) {
            var handler, _i, _len, _results;
            if (error instanceof key) {
              handled = true;
              _results = [];
              for (_i = 0, _len = value.length; _i < _len; _i++) {
                handler = value[_i];
                _results.push(handler.call(_this, error));
              }
              return _results;
            }
          });
        });
      }
      return handled;
    };

    function Controller() {
      this.redirect = __bind(this.redirect, this);

      this.handleError = __bind(this.handleError, this);

      this.errorHandler = __bind(this.errorHandler, this);
      Controller.__super__.constructor.apply(this, arguments);
      this._resetActionFrames();
    }

    Controller.prototype.renderCache = new Batman.RenderCache;

    Controller.prototype.defaultRenderYield = 'main';

    Controller.prototype.autoScrollToHash = true;

    Controller.prototype.dispatch = function(action, params) {
      var redirectTo;
      if (params == null) {
        params = {};
      }
      params.controller || (params.controller = this.get('routingKey'));
      params.action || (params.action = action);
      params.target || (params.target = this);
      this._resetActionFrames();
      this.set('action', action);
      this.set('params', params);
      Batman.DOM.Yield.cycleAll();
      this.executeAction(action, params);
      Batman.DOM.Yield.clearAllStale();
      redirectTo = this._afterFilterRedirect;
      delete this._afterFilterRedirect;
      if (redirectTo) {
        return Batman.redirect(redirectTo);
      }
    };

    Controller.prototype.executeAction = function(action, params) {
      var frame, oldRedirect, parentFrame, result, _ref, _ref1,
        _this = this;
      if (params == null) {
        params = this.get('params');
      }
      Batman.developer.assert(this[action], "Error! Controller action " + (this.get('routingKey')) + "." + action + " couldn't be found!");
      parentFrame = this._actionFrames[this._actionFrames.length - 1];
      frame = new Batman.ControllerActionFrame({
        parentFrame: parentFrame,
        action: action
      }, function() {
        var _ref;
        if (!_this._afterFilterRedirect) {
          _this._runFilters(action, params, 'afterFilters');
        }
        _this._resetActionFrames();
        return (_ref = Batman.navigator) != null ? _ref.redirect = oldRedirect : void 0;
      });
      this._actionFrames.push(frame);
      frame.startOperation({
        internal: true
      });
      oldRedirect = (_ref = Batman.navigator) != null ? _ref.redirect : void 0;
      if ((_ref1 = Batman.navigator) != null) {
        _ref1.redirect = this.redirect;
      }
      this._runFilters(action, params, 'beforeFilters');
      if (!this._afterFilterRedirect) {
        result = this[action](params);
      }
      if (!frame.operationOccurred) {
        this.render();
      }
      frame.finishOperation();
      return result;
    };

    Controller.prototype.redirect = function(url) {
      var frame;
      frame = this._actionFrames[this._actionFrames.length - 1];
      if (frame) {
        if (frame.operationOccurred) {
          Batman.developer.warn("Warning! Trying to redirect but an action has already been taken during " + (this.get('routingKey')) + "." + (frame.action || this.get('action')));
        }
        frame.startAndFinishOperation();
        if (this._afterFilterRedirect != null) {
          return Batman.developer.warn("Warning! Multiple actions trying to redirect!");
        } else {
          return this._afterFilterRedirect = url;
        }
      } else {
        if (Batman.typeOf(url) === 'Object') {
          if (!url.controller) {
            url.controller = this;
          }
        }
        return Batman.redirect(url);
      }
    };

    Controller.prototype.render = function(options) {
      var action, frame, view, _ref, _ref1,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (frame = (_ref = this._actionFrames) != null ? _ref[this._actionFrames.length - 1] : void 0) {
        frame.startOperation();
      }
      if (options === false) {
        frame.finishOperation();
        return;
      }
      action = (frame != null ? frame.action : void 0) || this.get('action');
      if (options) {
        options.into || (options.into = this.defaultRenderYield);
      }
      if (!options.view) {
        options.viewClass || (options.viewClass = this._viewClassForAction(action));
        options.context || (options.context = this.get('_renderContext'));
        options.source || (options.source = Batman.helpers.underscore(this.get('routingKey') + '/' + action));
        view = this.renderCache.viewForOptions(options);
      } else {
        view = options.view;
        options.view = null;
      }
      if (view) {
        if ((_ref1 = Batman.currentApp) != null) {
          _ref1.prevent('ready');
        }
        view.once('ready', function() {
          var _ref2;
          Batman.DOM.Yield.withName(options.into).replace(view.get('node'));
          if ((_ref2 = Batman.currentApp) != null) {
            _ref2.allowAndFire('ready');
          }
          return frame != null ? frame.finishOperation() : void 0;
        });
      }
      return view;
    };

    Controller.prototype.scrollToHash = function(hash) {
      if (hash == null) {
        hash = this.get('params')['#'];
      }
      return Batman.DOM.scrollIntoView(hash);
    };

    Controller.prototype._resetActionFrames = function() {
      return this._actionFrames = [];
    };

    Controller.prototype._viewClassForAction = function(action) {
      var classPrefix, _ref;
      classPrefix = this.get('routingKey').replace('/', '_');
      return ((_ref = Batman.currentApp) != null ? _ref[Batman.helpers.camelize("" + classPrefix + "_" + action + "_view")] : void 0) || Batman.View;
    };

    Controller.prototype._runFilters = function(action, params, filters) {
      var block, options, _i, _len, _ref;
      if (filters = (_ref = this.constructor._batman) != null ? _ref.get(filters) : void 0) {
        for (_i = 0, _len = filters.length; _i < _len; _i++) {
          options = filters[_i];
          if (options.only && __indexOf.call(options.only, action) < 0) {
            continue;
          }
          if (options.except && __indexOf.call(options.except, action) >= 0) {
            continue;
          }
          if (this._afterFilterRedirect) {
            return;
          }
          block = options.block;
          if (typeof block === 'function') {
            block.call(this, params);
          } else {
            if (typeof this[block] === "function") {
              this[block](params);
            }
          }
        }
      }
    };

    return Controller;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Set = (function(_super) {
    var k, _fn, _i, _j, _len, _len1, _ref, _ref1,
      _this = this;

    __extends(Set, _super);

    function Set() {
      Batman.SimpleSet.apply(this, arguments);
    }

    Batman.extend(Set.prototype, Batman.Enumerable);

    Set._applySetAccessors = function(klass) {
      var accessor, accessors, key, _results;
      accessors = {
        first: function() {
          return this.toArray()[0];
        },
        last: function() {
          return this.toArray()[this.length - 1];
        },
        isEmpty: function() {
          return this.isEmpty();
        },
        toArray: function() {
          return this.toArray();
        },
        length: function() {
          this.registerAsMutableSource();
          return this.length;
        },
        indexedBy: function() {
          var _this = this;
          return new Batman.TerminalAccessible(function(key) {
            return _this.indexedBy(key);
          });
        },
        indexedByUnique: function() {
          var _this = this;
          return new Batman.TerminalAccessible(function(key) {
            return _this.indexedByUnique(key);
          });
        },
        sortedBy: function() {
          var _this = this;
          return new Batman.TerminalAccessible(function(key) {
            return _this.sortedBy(key);
          });
        },
        sortedByDescending: function() {
          var _this = this;
          return new Batman.TerminalAccessible(function(key) {
            return _this.sortedBy(key, 'desc');
          });
        }
      };
      _results = [];
      for (key in accessors) {
        accessor = accessors[key];
        _results.push(klass.accessor(key, accessor));
      }
      return _results;
    };

    Set._applySetAccessors(Set);

    _ref = ['add', 'remove', 'clear', 'replace', 'indexedBy', 'indexedByUnique', 'sortedBy', 'equality', '_indexOfItem'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      Set.prototype[k] = Batman.SimpleSet.prototype[k];
    }

    _ref1 = ['find', 'merge', 'forEach', 'toArray', 'isEmpty', 'has'];
    _fn = function(k) {
      return Set.prototype[k] = function() {
        this.registerAsMutableSource();
        return Batman.SimpleSet.prototype[k].apply(this, arguments);
      };
    };
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      k = _ref1[_j];
      _fn(k);
    }

    Set.prototype.toJSON = Set.prototype.toArray;

    return Set;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ErrorsSet = (function(_super) {

    __extends(ErrorsSet, _super);

    function ErrorsSet() {
      return ErrorsSet.__super__.constructor.apply(this, arguments);
    }

    ErrorsSet.accessor(function(key) {
      return this.indexedBy('attribute').get(key);
    });

    ErrorsSet.prototype.add = function(key, error) {
      return ErrorsSet.__super__.add.call(this, new Batman.ValidationError(key, error));
    };

    return ErrorsSet;

  })(Batman.Set);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetProxy = (function(_super) {
    var k, _fn, _i, _len, _ref,
      _this = this;

    __extends(SetProxy, _super);

    function SetProxy(base) {
      var _this = this;
      this.base = base;
      SetProxy.__super__.constructor.call(this);
      this.length = this.base.length;
      this.base.on('itemsWereAdded', function() {
        var items;
        items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _this.set('length', _this.base.length);
        return _this.fire.apply(_this, ['itemsWereAdded'].concat(__slice.call(items)));
      });
      this.base.on('itemsWereRemoved', function() {
        var items;
        items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _this.set('length', _this.base.length);
        return _this.fire.apply(_this, ['itemsWereRemoved'].concat(__slice.call(items)));
      });
    }

    Batman.extend(SetProxy.prototype, Batman.Enumerable);

    SetProxy.prototype.filter = function(f) {
      return this.reduce(function(accumulator, element) {
        if (f(element)) {
          accumulator.add(element);
        }
        return accumulator;
      }, new Batman.Set());
    };

    SetProxy.prototype.replace = function() {
      var length, result;
      length = this.property('length');
      length.isolate();
      result = this.base.replace.apply(this, arguments);
      length.expose();
      return result;
    };

    Batman.Set._applySetAccessors(SetProxy);

    _ref = ['add', 'remove', 'find', 'clear', 'has', 'merge', 'toArray', 'isEmpty', 'indexedBy', 'indexedByUnique', 'sortedBy'];
    _fn = function(k) {
      return SetProxy.prototype[k] = function() {
        var _ref1;
        return (_ref1 = this.base)[k].apply(_ref1, arguments);
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }

    SetProxy.accessor('length', {
      get: function() {
        this.registerAsMutableSource();
        return this.length;
      },
      set: function(_, v) {
        return this.length = v;
      }
    });

    return SetProxy;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.BinarySetOperation = (function(_super) {

    __extends(BinarySetOperation, _super);

    function BinarySetOperation(left, right) {
      this.left = left;
      this.right = right;
      this._setup = __bind(this._setup, this);

      BinarySetOperation.__super__.constructor.call(this);
      this._setup(this.left, this.right);
      this._setup(this.right, this.left);
    }

    BinarySetOperation.prototype._setup = function(set, opposite) {
      var _this = this;
      set.on('itemsWereAdded', function() {
        var items;
        items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this._itemsWereAddedToSource.apply(_this, [set, opposite].concat(__slice.call(items)));
      });
      set.on('itemsWereRemoved', function() {
        var items;
        items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this._itemsWereRemovedFromSource.apply(_this, [set, opposite].concat(__slice.call(items)));
      });
      return this._itemsWereAddedToSource.apply(this, [set, opposite].concat(__slice.call(set.toArray())));
    };

    BinarySetOperation.prototype.merge = function() {
      var merged, others, set, _i, _len;
      others = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      merged = new Batman.Set;
      others.unshift(this);
      for (_i = 0, _len = others.length; _i < _len; _i++) {
        set = others[_i];
        set.forEach(function(v) {
          return merged.add(v);
        });
      }
      return merged;
    };

    BinarySetOperation.prototype.filter = Batman.SetProxy.prototype.filter;

    return BinarySetOperation;

  })(Batman.Set);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetUnion = (function(_super) {

    __extends(SetUnion, _super);

    function SetUnion() {
      return SetUnion.__super__.constructor.apply(this, arguments);
    }

    SetUnion.prototype._itemsWereAddedToSource = function() {
      var items, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return this.add.apply(this, items);
    };

    SetUnion.prototype._itemsWereRemovedFromSource = function() {
      var item, items, itemsToRemove, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      itemsToRemove = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (!opposite.has(item)) {
            _results.push(item);
          }
        }
        return _results;
      })();
      return this.remove.apply(this, itemsToRemove);
    };

    return SetUnion;

  })(Batman.BinarySetOperation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetIntersection = (function(_super) {

    __extends(SetIntersection, _super);

    function SetIntersection() {
      return SetIntersection.__super__.constructor.apply(this, arguments);
    }

    SetIntersection.prototype._itemsWereAddedToSource = function() {
      var item, items, itemsToAdd, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      itemsToAdd = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (opposite.has(item)) {
            _results.push(item);
          }
        }
        return _results;
      })();
      if (itemsToAdd.length > 0) {
        return this.add.apply(this, itemsToAdd);
      }
    };

    SetIntersection.prototype._itemsWereRemovedFromSource = function() {
      var items, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return this.remove.apply(this, items);
    };

    return SetIntersection;

  })(Batman.BinarySetOperation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetComplement = (function(_super) {

    __extends(SetComplement, _super);

    function SetComplement() {
      return SetComplement.__super__.constructor.apply(this, arguments);
    }

    SetComplement.prototype._itemsWereAddedToSource = function() {
      var item, items, itemsToAdd, itemsToRemove, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (source === this.left) {
        itemsToAdd = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            if (!opposite.has(item)) {
              _results.push(item);
            }
          }
          return _results;
        })();
        if (itemsToAdd.length > 0) {
          return this.add.apply(this, itemsToAdd);
        }
      } else {
        itemsToRemove = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            if (opposite.has(item)) {
              _results.push(item);
            }
          }
          return _results;
        })();
        if (itemsToRemove.length > 0) {
          return this.remove.apply(this, itemsToRemove);
        }
      }
    };

    SetComplement.prototype._itemsWereRemovedFromSource = function() {
      var item, items, itemsToAdd, opposite, source;
      source = arguments[0], opposite = arguments[1], items = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (source === this.left) {
        return this.remove.apply(this, items);
      } else {
        itemsToAdd = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            if (opposite.has(item)) {
              _results.push(item);
            }
          }
          return _results;
        })();
        if (itemsToAdd.length > 0) {
          return this.add.apply(this, itemsToAdd);
        }
      }
    };

    SetComplement.prototype._addComplement = function(items, opposite) {
      var item, itemsToAdd;
      itemsToAdd = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (opposite.has(item)) {
            _results.push(item);
          }
        }
        return _results;
      })();
      if (itemsToAdd.length > 0) {
        return this.add.apply(this, itemsToAdd);
      }
    };

    return SetComplement;

  })(Batman.BinarySetOperation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.StateMachine = (function(_super) {

    __extends(StateMachine, _super);

    StateMachine.InvalidTransitionError = function(message) {
      this.message = message != null ? message : "";
    };

    StateMachine.InvalidTransitionError.prototype = new Error;

    StateMachine.transitions = function(table) {
      var definePredicate, fromState, k, object, predicateKeys, toState, transitions, v, _fn, _ref,
        _this = this;
      for (k in table) {
        v = table[k];
        if (!(v.from && v.to)) {
          continue;
        }
        object = {};
        if (v.from.forEach) {
          v.from.forEach(function(fromKey) {
            return object[fromKey] = v.to;
          });
        } else {
          object[v.from] = v.to;
        }
        table[k] = object;
      }
      this.prototype.transitionTable = Batman.extend({}, this.prototype.transitionTable, table);
      predicateKeys = [];
      definePredicate = function(state) {
        var key;
        key = "is" + (Batman.helpers.capitalize(state));
        if (_this.prototype[key] != null) {
          return;
        }
        predicateKeys.push(key);
        return _this.prototype[key] = function() {
          return this.get('state') === state;
        };
      };
      _ref = this.prototype.transitionTable;
      _fn = function(k) {
        return _this.prototype[k] = function() {
          return this.startTransition(k);
        };
      };
      for (k in _ref) {
        transitions = _ref[k];
        if (!(!this.prototype[k])) {
          continue;
        }
        _fn(k);
        for (fromState in transitions) {
          toState = transitions[fromState];
          definePredicate(fromState);
          definePredicate(toState);
        }
      }
      if (predicateKeys.length) {
        this.accessor.apply(this, __slice.call(predicateKeys).concat([function(key) {
          return this[key]();
        }]));
      }
      return this;
    };

    function StateMachine(startState) {
      this.nextEvents = [];
      this.set('_state', startState);
    }

    StateMachine.accessor('state', function() {
      return this.get('_state');
    });

    StateMachine.prototype.isTransitioning = false;

    StateMachine.prototype.transitionTable = {};

    StateMachine.prototype.onTransition = function(from, into, callback) {
      return this.on("" + from + "->" + into, callback);
    };

    StateMachine.prototype.onEnter = function(into, callback) {
      return this.on("enter " + into, callback);
    };

    StateMachine.prototype.onExit = function(from, callback) {
      return this.on("exit " + from, callback);
    };

    StateMachine.prototype.startTransition = Batman.Property.wrapTrackingPrevention(function(event) {
      var nextState, previousState;
      if (this.isTransitioning) {
        this.nextEvents.push(event);
        return;
      }
      previousState = this.get('state');
      nextState = this.nextStateForEvent(event);
      if (!nextState) {
        return false;
      }
      this.isTransitioning = true;
      this.fire("exit " + previousState);
      this.set('_state', nextState);
      this.fire("" + previousState + "->" + nextState);
      this.fire("enter " + nextState);
      this.fire(event);
      this.isTransitioning = false;
      if (this.nextEvents.length > 0) {
        this.startTransition(this.nextEvents.shift());
      }
      return true;
    });

    StateMachine.prototype.canStartTransition = function(event, fromState) {
      if (fromState == null) {
        fromState = this.get('state');
      }
      return !!this.nextStateForEvent(event, fromState);
    };

    StateMachine.prototype.nextStateForEvent = function(event, fromState) {
      var _ref;
      if (fromState == null) {
        fromState = this.get('state');
      }
      return (_ref = this.transitionTable[event]) != null ? _ref[fromState] : void 0;
    };

    return StateMachine;

  })(Batman.Object);

  Batman.DelegatingStateMachine = (function(_super) {

    __extends(DelegatingStateMachine, _super);

    function DelegatingStateMachine(startState, base) {
      this.base = base;
      DelegatingStateMachine.__super__.constructor.call(this, startState);
    }

    DelegatingStateMachine.prototype.fire = function() {
      var result, _ref;
      result = DelegatingStateMachine.__super__.fire.apply(this, arguments);
      (_ref = this.base).fire.apply(_ref, arguments);
      return result;
    };

    return DelegatingStateMachine;

  })(Batman.StateMachine);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.Model = (function(_super) {
    var functionName, _i, _j, _len, _len1, _ref, _ref1;

    __extends(Model, _super);

    Model.storageKey = null;

    Model.primaryKey = 'id';

    Model.persist = function() {
      var mechanism, options;
      mechanism = arguments[0], options = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      Batman.initializeObject(this.prototype);
      mechanism = mechanism.isStorageAdapter ? mechanism : new mechanism(this);
      if (options.length > 0) {
        Batman.mixin.apply(Batman, [mechanism].concat(__slice.call(options)));
      }
      this.prototype._batman.storage = mechanism;
      return mechanism;
    };

    Model.storageAdapter = function() {
      Batman.initializeObject(this.prototype);
      return this.prototype._batman.storage;
    };

    Model.encode = function() {
      var encoder, encoderForKey, encoderOrLastKey, key, keys, _base, _i, _j, _len;
      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), encoderOrLastKey = arguments[_i++];
      Batman.initializeObject(this.prototype);
      (_base = this.prototype._batman).encoders || (_base.encoders = new Batman.SimpleHash);
      encoder = {};
      switch (Batman.typeOf(encoderOrLastKey)) {
        case 'String':
          keys.push(encoderOrLastKey);
          break;
        case 'Function':
          encoder.encode = encoderOrLastKey;
          break;
        default:
          encoder = encoderOrLastKey;
      }
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        encoderForKey = Batman.extend({
          as: key
        }, this.defaultEncoder, encoder);
        this.prototype._batman.encoders.set(key, encoderForKey);
      }
    };

    Model.defaultEncoder = {
      encode: function(x) {
        return x;
      },
      decode: function(x) {
        return x;
      }
    };

    Model.observeAndFire('primaryKey', function(newPrimaryKey, oldPrimaryKey) {
      this.encode(oldPrimaryKey, {
        encode: false,
        decode: false
      });
      return this.encode(newPrimaryKey, {
        encode: false,
        decode: this.defaultEncoder.decode
      });
    });

    Model.validate = function() {
      var keys, matches, optionsOrFunction, validatorClass, validators, _base, _i, _j, _len, _ref, _results;
      keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), optionsOrFunction = arguments[_i++];
      Batman.initializeObject(this.prototype);
      validators = (_base = this.prototype._batman).validators || (_base.validators = []);
      if (typeof optionsOrFunction === 'function') {
        return validators.push({
          keys: keys,
          callback: optionsOrFunction
        });
      } else {
        _ref = Batman.Validators;
        _results = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          validatorClass = _ref[_j];
          if ((matches = validatorClass.matches(optionsOrFunction))) {
            _results.push(validators.push({
              keys: keys,
              validator: new validatorClass(matches)
            }));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Model.classAccessor('resourceName', {
      get: function() {
        if (this.resourceName != null) {
          return this.resourceName;
        } else {
          if (Batman.config.minificationErrors) {
            Batman.developer.error("Please define " + (Batman.functionName(this)) + ".resourceName in order for your model to be minification safe.");
          }
          return Batman.helpers.underscore(Batman.functionName(this));
        }
      }
    });

    Model.classAccessor('all', {
      get: function() {
        this._batman.check(this);
        if (this.prototype.hasStorage() && !this._batman.allLoadTriggered) {
          this.load();
          this._batman.allLoadTriggered = true;
        }
        return this.get('loaded');
      },
      set: function(k, v) {
        return this.set('loaded', v);
      }
    });

    Model.classAccessor('loaded', {
      get: function() {
        return this._loaded || (this._loaded = new Batman.Set);
      },
      set: function(k, v) {
        return this._loaded = v;
      }
    });

    Model.classAccessor('first', function() {
      return this.get('all').toArray()[0];
    });

    Model.classAccessor('last', function() {
      var x;
      x = this.get('all').toArray();
      return x[x.length - 1];
    });

    Model.clear = function() {
      var result, _ref;
      Batman.initializeObject(this);
      result = this.get('loaded').clear();
      if ((_ref = this._batman.get('associations')) != null) {
        _ref.reset();
      }
      this._resetPromises();
      return result;
    };

    Model.find = function(id, callback) {
      return this.findWithOptions(id, void 0, callback);
    };

    Model.findWithOptions = function(id, options, callback) {
      var record;
      if (options == null) {
        options = {};
      }
      Batman.developer.assert(callback, "Must call find with a callback!");
      record = new this();
      record._withoutDirtyTracking(function() {
        return this.set('id', id);
      });
      record.loadWithOptions(options, callback);
      return record;
    };

    Model.load = function(options, callback) {
      var _ref;
      if ((_ref = typeof options) === 'function' || _ref === 'undefined') {
        callback = options;
        options = {};
      } else {
        options = {
          data: options
        };
      }
      return this.loadWithOptions(options, callback);
    };

    Model.loadWithOptions = function(options, callback) {
      var _this = this;
      this.fire('loading', options);
      return this._doStorageOperation('readAll', options, function(err, records, env) {
        var mappedRecords;
        if (err != null) {
          _this.fire('error', err);
          return typeof callback === "function" ? callback(err, []) : void 0;
        } else {
          mappedRecords = _this._mapIdentities(records);
          _this.fire('loaded', mappedRecords, env);
          return typeof callback === "function" ? callback(err, mappedRecords, env) : void 0;
        }
      });
    };

    Model.create = function(attrs, callback) {
      var obj, _ref;
      if (!callback) {
        _ref = [{}, attrs], attrs = _ref[0], callback = _ref[1];
      }
      obj = new this(attrs);
      obj.save(callback);
      return obj;
    };

    Model.findOrCreate = function(attrs, callback) {
      var foundRecord, record;
      record = new this(attrs);
      if (record.isNew()) {
        record.save(callback);
      } else {
        foundRecord = this._mapIdentity(record);
        callback(void 0, foundRecord);
      }
      return record;
    };

    Model.createFromJSON = function(json) {
      var record;
      record = new this;
      record._withoutDirtyTracking(function() {
        return this.fromJSON(json);
      });
      return this._mapIdentity(record);
    };

    Model._mapIdentity = function(record) {
      return this._mapIdentities([record])[0];
    };

    Model._mapIdentities = function(records) {
      var existing, id, index, newRecords, record, _i, _len, _ref, _ref1;
      newRecords = [];
      for (index = _i = 0, _len = records.length; _i < _len; index = ++_i) {
        record = records[index];
        if (!((id = record.get('id')) != null)) {
          continue;
        } else if (existing = (_ref = this.get('loaded.indexedBy.id').get(id)) != null ? _ref.toArray()[0] : void 0) {
          existing._withoutDirtyTracking(function() {
            var _ref1;
            return this.updateAttributes(((_ref1 = record.get('attributes')) != null ? _ref1.toObject() : void 0) || {});
          });
          records[index] = existing;
        } else {
          newRecords.push(record);
        }
      }
      if (newRecords.length) {
        (_ref1 = this.get('loaded')).add.apply(_ref1, newRecords);
      }
      return records;
    };

    Model._doStorageOperation = function(operation, options, callback) {
      var adapter;
      Batman.developer.assert(this.prototype.hasStorage(), "Can't " + operation + " model " + (Batman.functionName(this.constructor)) + " without any storage adapters!");
      adapter = this.prototype._batman.get('storage');
      return adapter.perform(operation, this, options, callback);
    };

    _ref = ['find', 'load', 'create'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      functionName = _ref[_i];
      Model[functionName] = Batman.Property.wrapTrackingPrevention(Model[functionName]);
    }

    Model.InstanceLifecycleStateMachine = (function(_super1) {

      __extends(InstanceLifecycleStateMachine, _super1);

      function InstanceLifecycleStateMachine() {
        return InstanceLifecycleStateMachine.__super__.constructor.apply(this, arguments);
      }

      InstanceLifecycleStateMachine.transitions({
        load: {
          from: ['dirty', 'clean'],
          to: 'loading'
        },
        create: {
          from: ['dirty', 'clean'],
          to: 'creating'
        },
        save: {
          from: ['dirty', 'clean'],
          to: 'saving'
        },
        destroy: {
          from: ['dirty', 'clean'],
          to: 'destroying'
        },
        failedValidation: {
          from: ['saving', 'creating'],
          to: 'dirty'
        },
        loaded: {
          loading: 'clean'
        },
        created: {
          creating: 'clean'
        },
        saved: {
          saving: 'clean'
        },
        destroyed: {
          destroying: 'destroyed'
        },
        set: {
          from: ['dirty', 'clean'],
          to: 'dirty'
        },
        error: {
          from: ['saving', 'creating', 'loading', 'destroying'],
          to: 'error'
        }
      });

      return InstanceLifecycleStateMachine;

    })(Batman.DelegatingStateMachine);

    function Model(idOrAttributes) {
      if (idOrAttributes == null) {
        idOrAttributes = {};
      }
      Batman.developer.assert(this instanceof Batman.Object, "constructors must be called with new");
      if (Batman.typeOf(idOrAttributes) === 'Object') {
        Model.__super__.constructor.call(this, idOrAttributes);
      } else {
        Model.__super__.constructor.call(this);
        this.set('id', idOrAttributes);
      }
    }

    Model.accessor('lifecycle', function() {
      return this.lifecycle || (this.lifecycle = new Batman.Model.InstanceLifecycleStateMachine('clean', this));
    });

    Model.accessor('attributes', function() {
      return this.attributes || (this.attributes = new Batman.Hash);
    });

    Model.accessor('dirtyKeys', function() {
      return this.dirtyKeys || (this.dirtyKeys = new Batman.Hash);
    });

    Model.accessor('_dirtiedKeys', function() {
      return this._dirtiedKeys || (this._dirtiedKeys = new Batman.SimpleSet);
    });

    Model.accessor('errors', function() {
      return this.errors || (this.errors = new Batman.ErrorsSet);
    });

    Model.accessor('isNew', function() {
      return this.isNew();
    });

    Model.accessor('isDirty', function() {
      return this.isDirty();
    });

    Model.accessor(Model.defaultAccessor = {
      get: function(k) {
        return Batman.getPath(this, ['attributes', k]);
      },
      set: function(k, v) {
        if (this._willSet(k)) {
          return this.get('attributes').set(k, v);
        } else {
          return this.get(k);
        }
      },
      unset: function(k) {
        return this.get('attributes').unset(k);
      }
    });

    Model.wrapAccessor('id', function(core) {
      return {
        get: function() {
          var primaryKey;
          primaryKey = this.constructor.primaryKey;
          if (primaryKey === 'id') {
            return core.get.apply(this, arguments);
          } else {
            return this.get(primaryKey);
          }
        },
        set: function(key, value) {
          var parsedValue, primaryKey;
          if ((typeof value === "string") && (value.match(/[^0-9]/) === null) && (("" + (parsedValue = parseInt(value, 10))) === value)) {
            value = parsedValue;
          }
          primaryKey = this.constructor.primaryKey;
          if (primaryKey === 'id') {
            this._willSet(key);
            return core.set.apply(this, arguments);
          } else {
            return this.set(primaryKey, value);
          }
        }
      };
    });

    Model.prototype.isNew = function() {
      return typeof this.get('id') === 'undefined';
    };

    Model.prototype.isDirty = function() {
      return this.get('lifecycle.state') === 'dirty';
    };

    Model.prototype.updateAttributes = function(attrs) {
      this.mixin(attrs);
      return this;
    };

    Model.prototype.toString = function() {
      return "" + (this.constructor.get('resourceName')) + ": " + (this.get('id'));
    };

    Model.prototype.toParam = function() {
      return this.get('id');
    };

    Model.prototype.toJSON = function() {
      var encoders, obj,
        _this = this;
      obj = {};
      encoders = this._batman.get('encoders');
      if (!(!encoders || encoders.isEmpty())) {
        encoders.forEach(function(key, encoder) {
          var encodedVal, val;
          if (encoder.encode) {
            val = _this.get(key);
            if (typeof val !== 'undefined') {
              encodedVal = encoder.encode(val, key, obj, _this);
              if (typeof encodedVal !== 'undefined') {
                return obj[encoder.as] = encodedVal;
              }
            }
          }
        });
      }
      return obj;
    };

    Model.prototype.fromJSON = function(data) {
      var encoders, key, obj, value,
        _this = this;
      obj = {};
      encoders = this._batman.get('encoders');
      if (!encoders || encoders.isEmpty() || !encoders.some(function(key, encoder) {
        return encoder.decode != null;
      })) {
        for (key in data) {
          value = data[key];
          obj[key] = value;
        }
      } else {
        encoders.forEach(function(key, encoder) {
          if (encoder.decode && typeof data[encoder.as] !== 'undefined') {
            return obj[key] = encoder.decode(data[encoder.as], encoder.as, data, obj, _this);
          }
        });
      }
      if (this.constructor.primaryKey !== 'id') {
        obj.id = data[this.constructor.primaryKey];
      }
      Batman.developer["do"](function() {
        if ((!encoders) || encoders.length <= 1) {
          return Batman.developer.warn("Warning: Model " + (Batman.functionName(_this.constructor)) + " has suspiciously few decoders!");
        }
      });
      return this.mixin(obj);
    };

    Model.prototype.hasStorage = function() {
      return this._batman.get('storage') != null;
    };

    Model.prototype.load = function(options, callback) {
      var _ref1;
      if (!callback) {
        _ref1 = [{}, options], options = _ref1[0], callback = _ref1[1];
      } else {
        options = {
          data: options
        };
      }
      return this.loadWithOptions(options, callback);
    };

    Model.prototype.loadWithOptions = function(options, callback) {
      var callbackQueue, hasOptions, _ref1,
        _this = this;
      hasOptions = Object.keys(options).length !== 0;
      if ((_ref1 = this.get('lifecycle.state')) === 'destroying' || _ref1 === 'destroyed') {
        if (typeof callback === "function") {
          callback(new Error("Can't load a destroyed record!"));
        }
        return;
      }
      if (this.get('lifecycle').load()) {
        callbackQueue = [];
        if (callback != null) {
          callbackQueue.push(callback);
        }
        if (!hasOptions) {
          this._currentLoad = callbackQueue;
        }
        return this._doStorageOperation('read', options, function(err, record, env) {
          var _j, _len1;
          if (!err) {
            _this.get('lifecycle').loaded();
            record = _this.constructor._mapIdentity(record);
          } else {
            _this.get('lifecycle').error();
          }
          if (!hasOptions) {
            _this._currentLoad = null;
          }
          for (_j = 0, _len1 = callbackQueue.length; _j < _len1; _j++) {
            callback = callbackQueue[_j];
            callback(err, record, env);
          }
        });
      } else {
        if (this.get('lifecycle.state') === 'loading' && !hasOptions) {
          if (callback != null) {
            return this._currentLoad.push(callback);
          }
        } else {
          return typeof callback === "function" ? callback(new Batman.StateMachine.InvalidTransitionError("Can't load while in state " + (this.get('lifecycle.state')))) : void 0;
        }
      }
    };

    Model.prototype.save = function(options, callback) {
      var endState, isNew, startState, storageOperation, _ref1, _ref2,
        _this = this;
      if (!callback) {
        _ref1 = [{}, options], options = _ref1[0], callback = _ref1[1];
      }
      isNew = this.isNew();
      _ref2 = isNew ? ['create', 'create', 'created'] : ['save', 'update', 'saved'], startState = _ref2[0], storageOperation = _ref2[1], endState = _ref2[2];
      if (this.get('lifecycle').startTransition(startState)) {
        return this.validate(function(error, errors) {
          var associations;
          if (error || errors.length) {
            _this.get('lifecycle').failedValidation();
            return typeof callback === "function" ? callback(error || errors, _this) : void 0;
          }
          associations = _this.constructor._batman.get('associations');
          _this._withoutDirtyTracking(function() {
            var _ref3,
              _this = this;
            return associations != null ? (_ref3 = associations.getByType('belongsTo')) != null ? _ref3.forEach(function(association, label) {
              return association.apply(_this);
            }) : void 0 : void 0;
          });
          return _this._doStorageOperation(storageOperation, {
            data: options
          }, function(err, record, env) {
            if (!err) {
              _this.get('dirtyKeys').clear();
              _this.get('_dirtiedKeys').clear();
              if (associations) {
                record._withoutDirtyTracking(function() {
                  var _ref3, _ref4;
                  if ((_ref3 = associations.getByType('hasOne')) != null) {
                    _ref3.forEach(function(association, label) {
                      return association.apply(err, record);
                    });
                  }
                  return (_ref4 = associations.getByType('hasMany')) != null ? _ref4.forEach(function(association, label) {
                    return association.apply(err, record);
                  }) : void 0;
                });
              }
              record = _this.constructor._mapIdentity(record);
              _this.get('lifecycle').startTransition(endState);
            } else {
              if (err instanceof Batman.ErrorsSet) {
                _this.get('lifecycle').failedValidation();
              } else {
                _this.get('lifecycle').error();
              }
            }
            return typeof callback === "function" ? callback(err, record || _this, env) : void 0;
          });
        });
      } else {
        return typeof callback === "function" ? callback(new Batman.StateMachine.InvalidTransitionError("Can't save while in state " + (this.get('lifecycle.state')))) : void 0;
      }
    };

    Model.prototype.destroy = function(options, callback) {
      var _ref1,
        _this = this;
      if (!callback) {
        _ref1 = [{}, options], options = _ref1[0], callback = _ref1[1];
      }
      if (this.get('lifecycle').destroy()) {
        return this._doStorageOperation('destroy', {
          data: options
        }, function(err, record, env) {
          if (!err) {
            _this.constructor.get('loaded').remove(_this);
            _this.get('lifecycle').destroyed();
          } else {
            _this.get('lifecycle').error();
          }
          return typeof callback === "function" ? callback(err, record, env) : void 0;
        });
      } else {
        return typeof callback === "function" ? callback(new Batman.StateMachine.InvalidTransitionError("Can't destroy while in state " + (this.get('lifecycle.state')))) : void 0;
      }
    };

    Model.prototype.validate = function(callback) {
      var args, count, errors, finishedValidation, key, validator, validators, _j, _k, _len1, _len2, _ref1;
      errors = this.get('errors');
      errors.clear();
      validators = this._batman.get('validators') || [];
      if (!validators || validators.length === 0) {
        if (typeof callback === "function") {
          callback(void 0, errors);
        }
        return true;
      }
      count = validators.reduce((function(acc, validator) {
        return acc + validator.keys.length;
      }), 0);
      finishedValidation = function() {
        if (--count === 0) {
          return typeof callback === "function" ? callback(void 0, errors) : void 0;
        }
      };
      for (_j = 0, _len1 = validators.length; _j < _len1; _j++) {
        validator = validators[_j];
        _ref1 = validator.keys;
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          key = _ref1[_k];
          args = [errors, this, key, finishedValidation];
          try {
            if (validator.validator) {
              validator.validator.validateEach.apply(validator.validator, args);
            } else {
              validator.callback.apply(validator, args);
            }
          } catch (e) {
            if (typeof callback === "function") {
              callback(e, errors);
            }
          }
        }
      }
    };

    Model.prototype.associationProxy = function(association) {
      var proxies, _base, _name;
      Batman.initializeObject(this);
      proxies = (_base = this._batman).associationProxies || (_base.associationProxies = {});
      proxies[_name = association.label] || (proxies[_name] = new association.proxyClass(association, this));
      return proxies[association.label];
    };

    Model.prototype._willSet = function(key) {
      if (this._pauseDirtyTracking) {
        return true;
      }
      if (this.get('lifecycle').startTransition('set')) {
        if (!this.get('_dirtiedKeys').has(key)) {
          this.set("dirtyKeys." + key, this.get(key));
          this.get('_dirtiedKeys').add(key);
        }
        return true;
      } else {
        return false;
      }
    };

    Model.prototype._doStorageOperation = function(operation, options, callback) {
      var adapter,
        _this = this;
      Batman.developer.assert(this.hasStorage(), "Can't " + operation + " model " + (Batman.functionName(this.constructor)) + " without any storage adapters!");
      adapter = this._batman.get('storage');
      return adapter.perform(operation, this, options, function() {
        return callback.apply(null, arguments);
      });
    };

    Model.prototype._withoutDirtyTracking = function(block) {
      var result;
      this._pauseDirtyTracking = true;
      result = block.call(this);
      this._pauseDirtyTracking = false;
      return result;
    };

    _ref1 = ['load', 'save', 'validate', 'destroy'];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      functionName = _ref1[_j];
      Model.prototype[functionName] = Batman.Property.wrapTrackingPrevention(Model.prototype[functionName]);
    }

    return Model;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var k, _fn, _i, _len, _ref,
    _this = this;

  _ref = Batman.AssociationCurator.availableAssociations;
  _fn = function(k) {
    return Batman.Model[k] = function(label, scope) {
      var collection, _base;
      Batman.initializeObject(this);
      collection = (_base = this._batman).associations || (_base.associations = new Batman.AssociationCurator(this));
      return collection.add(new Batman["" + (Batman.helpers.capitalize(k)) + "Association"](this, label, scope));
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    k = _ref[_i];
    _fn(k);
  }

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Proxy = (function(_super) {

    __extends(Proxy, _super);

    Proxy.prototype.isProxy = true;

    function Proxy(target) {
      Proxy.__super__.constructor.call(this);
      if (target != null) {
        this.set('target', target);
      }
    }

    Proxy.accessor('target', Batman.Property.defaultAccessor);

    Proxy.accessor({
      get: function(key) {
        var _ref;
        return (_ref = this.get('target')) != null ? _ref.get(key) : void 0;
      },
      set: function(key, value) {
        var _ref;
        return (_ref = this.get('target')) != null ? _ref.set(key, value) : void 0;
      },
      unset: function(key) {
        var _ref;
        return (_ref = this.get('target')) != null ? _ref.unset(key) : void 0;
      }
    });

    return Proxy;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.AssociationProxy = (function(_super) {

    __extends(AssociationProxy, _super);

    AssociationProxy.prototype.loaded = false;

    function AssociationProxy(association, model) {
      this.association = association;
      this.model = model;
      AssociationProxy.__super__.constructor.call(this);
    }

    AssociationProxy.prototype.toJSON = function() {
      var target;
      target = this.get('target');
      if (target != null) {
        return this.get('target').toJSON();
      }
    };

    AssociationProxy.prototype.load = function(callback) {
      var _this = this;
      this.fetch(function(err, proxiedRecord) {
        if (!err) {
          _this._setTarget(proxiedRecord);
        }
        return typeof callback === "function" ? callback(err, proxiedRecord) : void 0;
      });
      return this.get('target');
    };

    AssociationProxy.prototype.loadFromLocal = function() {
      var target;
      if (!this._canLoad()) {
        return;
      }
      if (target = this.fetchFromLocal()) {
        this._setTarget(target);
      }
      return target;
    };

    AssociationProxy.prototype.fetch = function(callback) {
      var record;
      if (!this._canLoad()) {
        return callback(void 0, void 0);
      }
      record = this.fetchFromLocal();
      if (record) {
        return callback(void 0, record);
      } else {
        return this.fetchFromRemote(callback);
      }
    };

    AssociationProxy.accessor('loaded', Batman.Property.defaultAccessor);

    AssociationProxy.accessor('target', {
      get: function() {
        return this.fetchFromLocal();
      },
      set: function(_, v) {
        return v;
      }
    });

    AssociationProxy.prototype._canLoad = function() {
      return (this.get('foreignValue') || this.get('primaryValue')) != null;
    };

    AssociationProxy.prototype._setTarget = function(target) {
      this.set('target', target);
      this.set('loaded', true);
      return this.fire('loaded', target);
    };

    return AssociationProxy;

  })(Batman.Proxy);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.HasOneProxy = (function(_super) {

    __extends(HasOneProxy, _super);

    function HasOneProxy() {
      return HasOneProxy.__super__.constructor.apply(this, arguments);
    }

    HasOneProxy.accessor('primaryValue', function() {
      return this.model.get(this.association.primaryKey);
    });

    HasOneProxy.prototype.fetchFromLocal = function() {
      return this.association.setIndex().get(this.get('primaryValue'));
    };

    HasOneProxy.prototype.fetchFromRemote = function(callback) {
      var loadOptions,
        _this = this;
      loadOptions = {
        data: {}
      };
      loadOptions.data[this.association.foreignKey] = this.get('primaryValue');
      if (this.association.options.url) {
        loadOptions.collectionUrl = this.association.options.url;
        loadOptions.urlContext = this.model;
      }
      return this.association.getRelatedModel().loadWithOptions(loadOptions, function(error, loadedRecords) {
        if (error) {
          throw error;
        }
        if (!loadedRecords || loadedRecords.length <= 0) {
          return callback(new Error("Couldn't find related record!"), void 0);
        } else {
          return callback(void 0, loadedRecords[0]);
        }
      });
    };

    return HasOneProxy;

  })(Batman.AssociationProxy);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.BelongsToProxy = (function(_super) {

    __extends(BelongsToProxy, _super);

    function BelongsToProxy() {
      return BelongsToProxy.__super__.constructor.apply(this, arguments);
    }

    BelongsToProxy.accessor('foreignValue', function() {
      return this.model.get(this.association.foreignKey);
    });

    BelongsToProxy.prototype.fetchFromLocal = function() {
      return this.association.setIndex().get(this.get('foreignValue'));
    };

    BelongsToProxy.prototype.fetchFromRemote = function(callback) {
      var loadOptions,
        _this = this;
      loadOptions = {};
      if (this.association.options.url) {
        loadOptions.recordUrl = this.association.options.url;
      }
      return this.association.getRelatedModel().findWithOptions(this.get('foreignValue'), loadOptions, function(error, loadedRecord) {
        if (error) {
          throw error;
        }
        return callback(void 0, loadedRecord);
      });
    };

    return BelongsToProxy;

  })(Batman.AssociationProxy);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicBelongsToProxy = (function(_super) {

    __extends(PolymorphicBelongsToProxy, _super);

    function PolymorphicBelongsToProxy() {
      return PolymorphicBelongsToProxy.__super__.constructor.apply(this, arguments);
    }

    PolymorphicBelongsToProxy.accessor('foreignTypeValue', function() {
      return this.model.get(this.association.foreignTypeKey);
    });

    PolymorphicBelongsToProxy.prototype.fetchFromLocal = function() {
      return this.association.setIndexForType(this.get('foreignTypeValue')).get(this.get('foreignValue'));
    };

    PolymorphicBelongsToProxy.prototype.fetchFromRemote = function(callback) {
      var loadOptions,
        _this = this;
      loadOptions = {};
      if (this.association.options.url) {
        loadOptions.recordUrl = this.association.options.url;
      }
      return this.association.getRelatedModelForType(this.get('foreignTypeValue')).findWithOptions(this.get('foreignValue'), loadOptions, function(error, loadedRecord) {
        if (error) {
          throw error;
        }
        return callback(void 0, loadedRecord);
      });
    };

    return PolymorphicBelongsToProxy;

  })(Batman.BelongsToProxy);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Accessible = (function(_super) {

    __extends(Accessible, _super);

    function Accessible() {
      this.accessor.apply(this, arguments);
    }

    return Accessible;

  })(Batman.Object);

  Batman.TerminalAccessible = (function(_super) {

    __extends(TerminalAccessible, _super);

    function TerminalAccessible() {
      return TerminalAccessible.__super__.constructor.apply(this, arguments);
    }

    TerminalAccessible.prototype.propertyClass = Batman.Property;

    return TerminalAccessible;

  })(Batman.Accessible);

}).call(this);

(function() {

  Batman.mixins = new Batman.Object;

}).call(this);

(function() {

  Batman.URI = (function() {
    /*
      # URI parsing
    */

    var attributes, childKeyMatchers, decodeQueryComponent, encodeComponent, encodeQueryComponent, keyVal, nameParser, normalizeParams, plus, queryFromParams, r20, strictParser;

    strictParser = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;

    attributes = ["source", "protocol", "authority", "userInfo", "user", "password", "hostname", "port", "relative", "path", "directory", "file", "query", "hash"];

    function URI(str) {
      var i, matches;
      matches = strictParser.exec(str);
      i = 14;
      while (i--) {
        this[attributes[i]] = matches[i] || '';
      }
      this.queryParams = this.constructor.paramsFromQuery(this.query);
      delete this.authority;
      delete this.userInfo;
      delete this.relative;
      delete this.directory;
      delete this.file;
      delete this.query;
    }

    URI.prototype.queryString = function() {
      return this.constructor.queryFromParams(this.queryParams);
    };

    URI.prototype.toString = function() {
      return [this.protocol ? "" + this.protocol + ":" : void 0, this.authority() ? "//" : void 0, this.authority(), this.relative()].join("");
    };

    URI.prototype.userInfo = function() {
      return [this.user, this.password ? ":" + this.password : void 0].join("");
    };

    URI.prototype.authority = function() {
      return [this.userInfo(), this.user || this.password ? "@" : void 0, this.hostname, this.port ? ":" + this.port : void 0].join("");
    };

    URI.prototype.relative = function() {
      var query;
      query = this.queryString();
      return [this.path, query ? "?" + query : void 0, this.hash ? "#" + this.hash : void 0].join("");
    };

    URI.prototype.directory = function() {
      var splitPath;
      splitPath = this.path.split('/');
      if (splitPath.length > 1) {
        return splitPath.slice(0, splitPath.length - 1).join('/') + "/";
      } else {
        return "";
      }
    };

    URI.prototype.file = function() {
      var splitPath;
      splitPath = this.path.split("/");
      return splitPath[splitPath.length - 1];
    };

    /*
      # query parsing
    */


    URI.paramsFromQuery = function(query) {
      var matches, params, segment, _i, _len, _ref;
      params = {};
      _ref = query.split('&');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        segment = _ref[_i];
        if (matches = segment.match(keyVal)) {
          normalizeParams(params, decodeQueryComponent(matches[1]), decodeQueryComponent(matches[2]));
        } else {
          normalizeParams(params, decodeQueryComponent(segment), null);
        }
      }
      return params;
    };

    URI.decodeQueryComponent = decodeQueryComponent = function(str) {
      return decodeURIComponent(str.replace(plus, '%20'));
    };

    nameParser = /^[\[\]]*([^\[\]]+)\]*(.*)/;

    childKeyMatchers = [/^\[\]\[([^\[\]]+)\]$/, /^\[\](.+)$/];

    plus = /\+/g;

    r20 = /%20/g;

    keyVal = /^([^=]*)=(.*)/;

    normalizeParams = function(params, name, v) {
      var after, childKey, k, last, matches, _ref, _ref1, _ref2;
      if (matches = name.match(nameParser)) {
        k = matches[1];
        after = matches[2];
      } else {
        return;
      }
      if (after === '') {
        params[k] = v;
      } else if (after === '[]') {
        if ((_ref = params[k]) == null) {
          params[k] = [];
        }
        if (Batman.typeOf(params[k]) !== 'Array') {
          throw new Error("expected Array (got " + (Batman.typeOf(params[k])) + ") for param \"" + k + "\"");
        }
        params[k].push(v);
      } else if (matches = after.match(childKeyMatchers[0]) || after.match(childKeyMatchers[1])) {
        childKey = matches[1];
        if ((_ref1 = params[k]) == null) {
          params[k] = [];
        }
        if (Batman.typeOf(params[k]) !== 'Array') {
          throw new Error("expected Array (got " + (Batman.typeOf(params[k])) + ") for param \"" + k + "\"");
        }
        last = params[k][params[k].length - 1];
        if (Batman.typeOf(last) === 'Object' && !(childKey in last)) {
          normalizeParams(last, childKey, v);
        } else {
          params[k].push(normalizeParams({}, childKey, v));
        }
      } else {
        if ((_ref2 = params[k]) == null) {
          params[k] = {};
        }
        if (Batman.typeOf(params[k]) !== 'Object') {
          throw new Error("expected Object (got " + (Batman.typeOf(params[k])) + ") for param \"" + k + "\"");
        }
        params[k] = normalizeParams(params[k], after, v);
      }
      return params;
    };

    /*
      # query building
    */


    URI.queryFromParams = queryFromParams = function(value, prefix) {
      var arrayResults, k, v, valueType;
      if (value == null) {
        return prefix;
      }
      valueType = Batman.typeOf(value);
      if (!((prefix != null) || valueType === 'Object')) {
        throw new Error("value must be an Object");
      }
      switch (valueType) {
        case 'Array':
          return ((function() {
            var _i, _len;
            arrayResults = [];
            if (value.length === 0) {
              arrayResults.push(queryFromParams(null, "" + prefix + "[]"));
            } else {
              for (_i = 0, _len = value.length; _i < _len; _i++) {
                v = value[_i];
                arrayResults.push(queryFromParams(v, "" + prefix + "[]"));
              }
            }
            return arrayResults;
          })()).join("&");
        case 'Object':
          return ((function() {
            var _results;
            _results = [];
            for (k in value) {
              v = value[k];
              _results.push(queryFromParams(v, prefix ? "" + prefix + "[" + (encodeQueryComponent(k)) + "]" : encodeQueryComponent(k)));
            }
            return _results;
          })()).join("&");
        default:
          if (prefix != null) {
            return "" + prefix + "=" + (encodeQueryComponent(value));
          } else {
            return encodeQueryComponent(value);
          }
      }
    };

    URI.encodeComponent = encodeComponent = function(str) {
      if (str != null) {
        return encodeURIComponent(str);
      } else {
        return '';
      }
    };

    URI.encodeQueryComponent = encodeQueryComponent = function(str) {
      return encodeComponent(str).replace(r20, '+');
    };

    return URI;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.Request = (function(_super) {
    var dataHasFileUploads;

    __extends(Request, _super);

    Request.objectToFormData = function(data) {
      var formData, key, pairForList, val, _i, _len, _ref, _ref1;
      pairForList = function(key, object, first) {
        var k, list, v;
        if (first == null) {
          first = false;
        }
        if (object instanceof Batman.container.File) {
          return [[key, object]];
        }
        return list = (function() {
          switch (Batman.typeOf(object)) {
            case 'Object':
              list = (function() {
                var _results;
                _results = [];
                for (k in object) {
                  v = object[k];
                  _results.push(pairForList((first ? k : "" + key + "[" + k + "]"), v));
                }
                return _results;
              })();
              return list.reduce(function(acc, list) {
                return acc.concat(list);
              }, []);
            case 'Array':
              return object.reduce(function(acc, element) {
                return acc.concat(pairForList("" + key + "[]", element));
              }, []);
            default:
              return [[key, object != null ? object : ""]];
          }
        })();
      };
      formData = new Batman.container.FormData();
      _ref = pairForList("", data, true);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], key = _ref1[0], val = _ref1[1];
        formData.append(key, val);
      }
      return formData;
    };

    Request.dataHasFileUploads = dataHasFileUploads = function(data) {
      var k, type, v, _i, _len;
      if ((typeof File !== "undefined" && File !== null) && data instanceof File) {
        return true;
      }
      type = Batman.typeOf(data);
      switch (type) {
        case 'Object':
          for (k in data) {
            v = data[k];
            if (dataHasFileUploads(v)) {
              return true;
            }
          }
          break;
        case 'Array':
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            v = data[_i];
            if (dataHasFileUploads(v)) {
              return true;
            }
          }
      }
      return false;
    };

    Request.wrapAccessor('method', function(core) {
      return {
        set: function(k, val) {
          return core.set.call(this, k, val != null ? typeof val.toUpperCase === "function" ? val.toUpperCase() : void 0 : void 0);
        }
      };
    });

    Request.prototype.method = 'GET';

    Request.prototype.hasFileUploads = function() {
      return dataHasFileUploads(this.data);
    };

    Request.prototype.contentType = 'application/x-www-form-urlencoded';

    Request.prototype.autosend = true;

    function Request(options) {
      var handler, handlers, k, _ref;
      handlers = {};
      for (k in options) {
        handler = options[k];
        if (!(k === 'success' || k === 'error' || k === 'loading' || k === 'loaded')) {
          continue;
        }
        handlers[k] = handler;
        delete options[k];
      }
      Request.__super__.constructor.call(this, options);
      for (k in handlers) {
        handler = handlers[k];
        this.on(k, handler);
      }
      if (((_ref = this.get('url')) != null ? _ref.length : void 0) > 0) {
        if (this.autosend) {
          this.send();
        }
      } else {
        this.observe('url', function(url) {
          if (url != null) {
            return this.send();
          }
        });
      }
    }

    Request.prototype.send = function() {
      return Batman.developer.error("Please source a dependency file for a request implementation");
    };

    return Request;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetObserver = (function(_super) {

    __extends(SetObserver, _super);

    function SetObserver(base) {
      var _this = this;
      this.base = base;
      this._itemObservers = new Batman.SimpleHash;
      this._setObservers = new Batman.SimpleHash;
      this._setObservers.set("itemsWereAdded", function() {
        return _this.fire.apply(_this, ['itemsWereAdded'].concat(__slice.call(arguments)));
      });
      this._setObservers.set("itemsWereRemoved", function() {
        return _this.fire.apply(_this, ['itemsWereRemoved'].concat(__slice.call(arguments)));
      });
      this.on('itemsWereAdded', this.startObservingItems.bind(this));
      this.on('itemsWereRemoved', this.stopObservingItems.bind(this));
    }

    SetObserver.prototype.observedItemKeys = [];

    SetObserver.prototype.observerForItemAndKey = function(item, key) {};

    SetObserver.prototype._getOrSetObserverForItemAndKey = function(item, key) {
      var _this = this;
      return this._itemObservers.getOrSet(item, function() {
        var observersByKey;
        observersByKey = new Batman.SimpleHash;
        return observersByKey.getOrSet(key, function() {
          return _this.observerForItemAndKey(item, key);
        });
      });
    };

    SetObserver.prototype.startObserving = function() {
      this._manageItemObservers("observe");
      return this._manageSetObservers("addHandler");
    };

    SetObserver.prototype.stopObserving = function() {
      this._manageItemObservers("forget");
      return this._manageSetObservers("removeHandler");
    };

    SetObserver.prototype.startObservingItems = function() {
      var item, items, _i, _len, _results;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        _results.push(this._manageObserversForItem(item, "observe"));
      }
      return _results;
    };

    SetObserver.prototype.stopObservingItems = function() {
      var item, items, _i, _len, _results;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        _results.push(this._manageObserversForItem(item, "forget"));
      }
      return _results;
    };

    SetObserver.prototype._manageObserversForItem = function(item, method) {
      var key, _i, _len, _ref;
      if (!item.isObservable) {
        return;
      }
      _ref = this.observedItemKeys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        item[method](key, this._getOrSetObserverForItemAndKey(item, key));
      }
      if (method === "forget") {
        return this._itemObservers.unset(item);
      }
    };

    SetObserver.prototype._manageItemObservers = function(method) {
      var _this = this;
      return this.base.forEach(function(item) {
        return _this._manageObserversForItem(item, method);
      });
    };

    SetObserver.prototype._manageSetObservers = function(method) {
      var _this = this;
      if (!this.base.isObservable) {
        return;
      }
      return this._setObservers.forEach(function(key, observer) {
        return _this.base.event(key)[method](observer);
      });
    };

    return SetObserver;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.SetSort = (function(_super) {

    __extends(SetSort, _super);

    function SetSort(base, key, order) {
      var boundReIndex,
        _this = this;
      this.key = key;
      if (order == null) {
        order = "asc";
      }
      SetSort.__super__.constructor.call(this, base);
      this.descending = order.toLowerCase() === "desc";
      if (this.base.isObservable) {
        this._setObserver = new Batman.SetObserver(this.base);
        this._setObserver.observedItemKeys = [this.key];
        boundReIndex = function() {
          return _this._reIndex();
        };
        this._setObserver.observerForItemAndKey = function() {
          return boundReIndex;
        };
        this._setObserver.on('itemsWereAdded', boundReIndex);
        this._setObserver.on('itemsWereRemoved', boundReIndex);
        this.startObserving();
      }
      this._reIndex();
    }

    SetSort.prototype.startObserving = function() {
      var _ref;
      return (_ref = this._setObserver) != null ? _ref.startObserving() : void 0;
    };

    SetSort.prototype.stopObserving = function() {
      var _ref;
      return (_ref = this._setObserver) != null ? _ref.stopObserving() : void 0;
    };

    SetSort.prototype.toArray = function() {
      return this.get('_storage');
    };

    SetSort.prototype.forEach = function(iterator, ctx) {
      var e, i, _i, _len, _ref, _results;
      _ref = this.get('_storage');
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        e = _ref[i];
        _results.push(iterator.call(ctx, e, i, this));
      }
      return _results;
    };

    SetSort.prototype.find = function(block) {
      var item, _i, _len, _ref;
      this.base.registerAsMutableSource();
      _ref = this.get('_storage');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (block(item)) {
          return item;
        }
      }
    };

    SetSort.prototype.merge = function(other) {
      this.base.registerAsMutableSource();
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args), t = typeof result;
        return t == "object" || t == "function" ? result || child : child;
      })(Batman.Set, this._storage, function(){}).merge(other).sortedBy(this.key, this.order);
    };

    SetSort.prototype.compare = function(a, b) {
      if (a === b) {
        return 0;
      }
      if (a === void 0) {
        return 1;
      }
      if (b === void 0) {
        return -1;
      }
      if (a === null) {
        return 1;
      }
      if (b === null) {
        return -1;
      }
      if (a === false) {
        return 1;
      }
      if (b === false) {
        return -1;
      }
      if (a === true) {
        return 1;
      }
      if (b === true) {
        return -1;
      }
      if (a !== a) {
        if (b !== b) {
          return 0;
        } else {
          return 1;
        }
      }
      if (b !== b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      return 0;
    };

    SetSort.prototype._reIndex = function() {
      var newOrder, _ref,
        _this = this;
      newOrder = this.base.toArray().sort(function(a, b) {
        var multiple, valueA, valueB;
        valueA = Batman.get(a, _this.key);
        if (typeof valueA === 'function') {
          valueA = valueA.call(a);
        }
        if (valueA != null) {
          valueA = valueA.valueOf();
        }
        valueB = Batman.get(b, _this.key);
        if (typeof valueB === 'function') {
          valueB = valueB.call(b);
        }
        if (valueB != null) {
          valueB = valueB.valueOf();
        }
        multiple = _this.descending ? -1 : 1;
        return _this.compare.call(_this, valueA, valueB) * multiple;
      });
      if ((_ref = this._setObserver) != null) {
        _ref.startObservingItems.apply(_ref, newOrder);
      }
      return this.set('_storage', newOrder);
    };

    return SetSort;

  })(Batman.SetProxy);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.AssociationSet = (function(_super) {

    __extends(AssociationSet, _super);

    function AssociationSet(foreignKeyValue, association) {
      var base;
      this.foreignKeyValue = foreignKeyValue;
      this.association = association;
      base = new Batman.Set;
      AssociationSet.__super__.constructor.call(this, base, '_batmanID');
    }

    AssociationSet.prototype.loaded = false;

    AssociationSet.prototype.load = function(callback) {
      var _this = this;
      if (this.foreignKeyValue == null) {
        return callback(void 0, this);
      }
      return this.association.getRelatedModel().loadWithOptions(this._getLoadOptions(), function(err, records) {
        if (!err) {
          _this.markAsLoaded();
        }
        return callback(err, _this);
      });
    };

    AssociationSet.prototype._getLoadOptions = function() {
      var loadOptions;
      loadOptions = {
        data: {}
      };
      loadOptions.data[this.association.foreignKey] = this.foreignKeyValue;
      if (this.association.options.url) {
        loadOptions.collectionUrl = this.association.options.url;
        loadOptions.urlContext = this.association.parentSetIndex().get(this.foreignKeyValue);
      }
      return loadOptions;
    };

    AssociationSet.accessor('loaded', Batman.Property.defaultAccessor);

    AssociationSet.prototype.markAsLoaded = function() {
      this.set('loaded', true);
      return this.fire('loaded');
    };

    return AssociationSet;

  })(Batman.SetSort);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicAssociationSet = (function(_super) {

    __extends(PolymorphicAssociationSet, _super);

    function PolymorphicAssociationSet(foreignKeyValue, foreignTypeKeyValue, association) {
      this.foreignKeyValue = foreignKeyValue;
      this.foreignTypeKeyValue = foreignTypeKeyValue;
      this.association = association;
      PolymorphicAssociationSet.__super__.constructor.call(this, this.foreignKeyValue, this.association);
    }

    PolymorphicAssociationSet.prototype._getLoadOptions = function() {
      var loadOptions;
      loadOptions = {
        data: {}
      };
      loadOptions.data[this.association.foreignKey] = this.foreignKeyValue;
      loadOptions.data[this.association.foreignTypeKey] = this.foreignTypeKeyValue;
      if (this.association.options.url) {
        loadOptions.collectionUrl = this.association.options.url;
        loadOptions.urlContext = this.association.parentSetIndex().get(this.foreignKeyValue);
      }
      return loadOptions;
    };

    return PolymorphicAssociationSet;

  })(Batman.AssociationSet);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.SetIndex = (function(_super) {

    __extends(SetIndex, _super);

    SetIndex.accessor('toArray', function() {
      return this.toArray();
    });

    Batman.extend(SetIndex.prototype, Batman.Enumerable);

    SetIndex.prototype.propertyClass = Batman.Property;

    function SetIndex(base, key) {
      var _this = this;
      this.base = base;
      this.key = key;
      SetIndex.__super__.constructor.call(this);
      this._storage = new Batman.Hash;
      if (this.base.isEventEmitter) {
        this._setObserver = new Batman.SetObserver(this.base);
        this._setObserver.observedItemKeys = [this.key];
        this._setObserver.observerForItemAndKey = this.observerForItemAndKey.bind(this);
        this._setObserver.on('itemsWereAdded', function() {
          var item, items, _i, _len, _results;
          items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            _results.push(_this._addItem(item));
          }
          return _results;
        });
        this._setObserver.on('itemsWereRemoved', function() {
          var item, items, _i, _len, _results;
          items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            _results.push(_this._removeItem(item));
          }
          return _results;
        });
      }
      this.base.forEach(this._addItem.bind(this));
      this.startObserving();
    }

    SetIndex.accessor(function(key) {
      return this._resultSetForKey(key);
    });

    SetIndex.prototype.startObserving = function() {
      var _ref;
      return (_ref = this._setObserver) != null ? _ref.startObserving() : void 0;
    };

    SetIndex.prototype.stopObserving = function() {
      var _ref;
      return (_ref = this._setObserver) != null ? _ref.stopObserving() : void 0;
    };

    SetIndex.prototype.observerForItemAndKey = function(item, key) {
      var _this = this;
      return function(newValue, oldValue) {
        _this._removeItemFromKey(item, oldValue);
        return _this._addItemToKey(item, newValue);
      };
    };

    SetIndex.prototype.forEach = function(iterator, ctx) {
      var _this = this;
      return this._storage.forEach(function(key, set) {
        if (set.get('length') > 0) {
          return iterator.call(ctx, key, set, _this);
        }
      });
    };

    SetIndex.prototype.toArray = function() {
      var results;
      results = [];
      this._storage.forEach(function(key, set) {
        if (set.get('length') > 0) {
          return results.push(key);
        }
      });
      return results;
    };

    SetIndex.prototype._addItem = function(item) {
      return this._addItemToKey(item, this._keyForItem(item));
    };

    SetIndex.prototype._addItemToKey = function(item, key) {
      return this._resultSetForKey(key).add(item);
    };

    SetIndex.prototype._removeItem = function(item) {
      return this._removeItemFromKey(item, this._keyForItem(item));
    };

    SetIndex.prototype._removeItemFromKey = function(item, key) {
      return this._resultSetForKey(key).remove(item);
    };

    SetIndex.prototype._resultSetForKey = function(key) {
      return this._storage.getOrSet(key, function() {
        return new Batman.Set;
      });
    };

    SetIndex.prototype._keyForItem = function(item) {
      return Batman.Keypath.forBaseAndKey(item, this.key).getValue();
    };

    return SetIndex;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicAssociationSetIndex = (function(_super) {

    __extends(PolymorphicAssociationSetIndex, _super);

    function PolymorphicAssociationSetIndex(association, type, key) {
      this.association = association;
      this.type = type;
      PolymorphicAssociationSetIndex.__super__.constructor.call(this, this.association.getRelatedModel().get('loaded'), key);
    }

    PolymorphicAssociationSetIndex.prototype._resultSetForKey = function(key) {
      return this.association.setForKey(key);
    };

    PolymorphicAssociationSetIndex.prototype._addItem = function(item) {
      if (this.association.modelType() !== item.get(this.association.foreignTypeKey)) {
        return;
      }
      return PolymorphicAssociationSetIndex.__super__._addItem.apply(this, arguments);
    };

    PolymorphicAssociationSetIndex.prototype._removeItem = function(item) {
      if (this.association.modelType() !== item.get(this.association.foreignTypeKey)) {
        return;
      }
      return PolymorphicAssociationSetIndex.__super__._removeItem.apply(this, arguments);
    };

    return PolymorphicAssociationSetIndex;

  })(Batman.SetIndex);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.AssociationSetIndex = (function(_super) {

    __extends(AssociationSetIndex, _super);

    function AssociationSetIndex(association, key) {
      this.association = association;
      AssociationSetIndex.__super__.constructor.call(this, this.association.getRelatedModel().get('loaded'), key);
    }

    AssociationSetIndex.prototype._resultSetForKey = function(key) {
      return this.association.setForKey(key);
    };

    AssociationSetIndex.prototype.forEach = function(iterator, ctx) {
      var _this = this;
      return this.association.proxies.forEach(function(record, set) {
        var key;
        key = _this.association.indexValueForRecord(record);
        if (set.get('length') > 0) {
          return iterator.call(ctx, key, set, _this);
        }
      });
    };

    AssociationSetIndex.prototype.toArray = function() {
      var results;
      results = [];
      this.forEach(function(key) {
        return results.push(key);
      });
      return results;
    };

    return AssociationSetIndex;

  })(Batman.SetIndex);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.UniqueSetIndex = (function(_super) {

    __extends(UniqueSetIndex, _super);

    function UniqueSetIndex() {
      this._uniqueIndex = new Batman.Hash;
      UniqueSetIndex.__super__.constructor.apply(this, arguments);
    }

    UniqueSetIndex.accessor(function(key) {
      return this._uniqueIndex.get(key);
    });

    UniqueSetIndex.prototype._addItemToKey = function(item, key) {
      this._resultSetForKey(key).add(item);
      if (!this._uniqueIndex.hasKey(key)) {
        return this._uniqueIndex.set(key, item);
      }
    };

    UniqueSetIndex.prototype._removeItemFromKey = function(item, key) {
      var resultSet;
      resultSet = this._resultSetForKey(key);
      UniqueSetIndex.__super__._removeItemFromKey.apply(this, arguments);
      if (resultSet.isEmpty()) {
        return this._uniqueIndex.unset(key);
      } else {
        return this._uniqueIndex.set(key, resultSet.toArray()[0]);
      }
    };

    return UniqueSetIndex;

  })(Batman.SetIndex);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.UniqueAssociationSetIndex = (function(_super) {

    __extends(UniqueAssociationSetIndex, _super);

    function UniqueAssociationSetIndex(association, key) {
      this.association = association;
      UniqueAssociationSetIndex.__super__.constructor.call(this, this.association.getRelatedModel().get('loaded'), key);
    }

    return UniqueAssociationSetIndex;

  })(Batman.UniqueSetIndex);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicUniqueAssociationSetIndex = (function(_super) {

    __extends(PolymorphicUniqueAssociationSetIndex, _super);

    function PolymorphicUniqueAssociationSetIndex(association, type, key) {
      this.association = association;
      this.type = type;
      PolymorphicUniqueAssociationSetIndex.__super__.constructor.call(this, this.association.getRelatedModelForType(type).get('loaded'), key);
    }

    return PolymorphicUniqueAssociationSetIndex;

  })(Batman.UniqueSetIndex);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  Batman.Navigator = (function() {

    Navigator.defaultClass = function() {
      if (Batman.config.usePushState && Batman.PushStateNavigator.isSupported()) {
        return Batman.PushStateNavigator;
      } else {
        return Batman.HashbangNavigator;
      }
    };

    Navigator.forApp = function(app) {
      return new (this.defaultClass())(app);
    };

    function Navigator(app) {
      this.app = app;
      this.handleCurrentLocation = __bind(this.handleCurrentLocation, this);

    }

    Navigator.prototype.start = function() {
      var _this = this;
      if (typeof window === 'undefined') {
        return;
      }
      if (this.started) {
        return;
      }
      this.started = true;
      this.startWatching();
      Batman.currentApp.prevent('ready');
      return Batman.setImmediate(function() {
        if (_this.started && Batman.currentApp) {
          _this.handleCurrentLocation();
          return Batman.currentApp.allowAndFire('ready');
        }
      });
    };

    Navigator.prototype.stop = function() {
      this.stopWatching();
      return this.started = false;
    };

    Navigator.prototype.handleLocation = function(location) {
      var path;
      path = this.pathFromLocation(location);
      if (path === this.cachedPath) {
        return;
      }
      return this.dispatch(path);
    };

    Navigator.prototype.handleCurrentLocation = function() {
      return this.handleLocation(window.location);
    };

    Navigator.prototype.dispatch = function(params) {
      this.cachedPath = this.app.get('dispatcher').dispatch(params);
      if (this._lastRedirect) {
        this.cachedPath = this._lastRedirect;
      }
      return this.cachedPath;
    };

    Navigator.prototype.push = function(params) {
      var path, pathFromParams, _base;
      pathFromParams = typeof (_base = this.app.get('dispatcher')).pathFromParams === "function" ? _base.pathFromParams(params) : void 0;
      if (pathFromParams) {
        this._lastRedirect = pathFromParams;
      }
      path = this.dispatch(params);
      if (!this._lastRedirect || this._lastRedirect === path) {
        this.pushState(null, '', path);
      }
      return path;
    };

    Navigator.prototype.replace = function(params) {
      var path, pathFromParams, _base;
      pathFromParams = typeof (_base = this.app.get('dispatcher')).pathFromParams === "function" ? _base.pathFromParams(params) : void 0;
      if (pathFromParams) {
        this._lastRedirect = pathFromParams;
      }
      path = this.dispatch(params);
      if (!this._lastRedirect || this._lastRedirect === path) {
        this.replaceState(null, '', path);
      }
      return path;
    };

    Navigator.prototype.redirect = Navigator.prototype.push;

    Navigator.prototype.normalizePath = function() {
      var i, seg, segments;
      segments = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      segments = (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = segments.length; _i < _len; i = ++_i) {
          seg = segments[i];
          _results.push(("" + seg).replace(/^(?!\/)/, '/').replace(/\/+$/, ''));
        }
        return _results;
      })();
      return segments.join('') || '/';
    };

    Navigator.normalizePath = Navigator.prototype.normalizePath;

    return Navigator;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PushStateNavigator = (function(_super) {

    __extends(PushStateNavigator, _super);

    function PushStateNavigator() {
      return PushStateNavigator.__super__.constructor.apply(this, arguments);
    }

    PushStateNavigator.isSupported = function() {
      var _ref;
      return (typeof window !== "undefined" && window !== null ? (_ref = window.history) != null ? _ref.pushState : void 0 : void 0) != null;
    };

    PushStateNavigator.prototype.startWatching = function() {
      return Batman.DOM.addEventListener(window, 'popstate', this.handleCurrentLocation);
    };

    PushStateNavigator.prototype.stopWatching = function() {
      return Batman.DOM.removeEventListener(window, 'popstate', this.handleCurrentLocation);
    };

    PushStateNavigator.prototype.pushState = function(stateObject, title, path) {
      if (path !== this.pathFromLocation(window.location)) {
        return window.history.pushState(stateObject, title, this.linkTo(path));
      }
    };

    PushStateNavigator.prototype.replaceState = function(stateObject, title, path) {
      if (path !== this.pathFromLocation(window.location)) {
        return window.history.replaceState(stateObject, title, this.linkTo(path));
      }
    };

    PushStateNavigator.prototype.linkTo = function(url) {
      return this.normalizePath(Batman.config.pathPrefix, url);
    };

    PushStateNavigator.prototype.pathFromLocation = function(location) {
      var fullPath, prefixPattern;
      fullPath = "" + (location.pathname || '') + (location.search || '');
      prefixPattern = new RegExp("^" + (this.normalizePath(Batman.config.pathPrefix)));
      return this.normalizePath(fullPath.replace(prefixPattern, ''));
    };

    PushStateNavigator.prototype.handleLocation = function(location) {
      var hashbangPath, path;
      path = this.pathFromLocation(location);
      if (path === '/' && (hashbangPath = Batman.HashbangNavigator.prototype.pathFromLocation(location)) !== '/') {
        return this.replace(hashbangPath);
      } else {
        return PushStateNavigator.__super__.handleLocation.apply(this, arguments);
      }
    };

    return PushStateNavigator;

  })(Batman.Navigator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.HashbangNavigator = (function(_super) {

    __extends(HashbangNavigator, _super);

    function HashbangNavigator() {
      return HashbangNavigator.__super__.constructor.apply(this, arguments);
    }

    HashbangNavigator.prototype.HASH_PREFIX = '#!';

    if ((typeof window !== "undefined" && window !== null) && 'onhashchange' in window) {
      HashbangNavigator.prototype.startWatching = function() {
        return Batman.DOM.addEventListener(window, 'hashchange', this.handleCurrentLocation);
      };
      HashbangNavigator.prototype.stopWatching = function() {
        return Batman.DOM.removeEventListener(window, 'hashchange', this.handleCurrentLocation);
      };
    } else {
      HashbangNavigator.prototype.startWatching = function() {
        return this.interval = setInterval(this.handleCurrentLocation, 100);
      };
      HashbangNavigator.prototype.stopWatching = function() {
        return this.interval = clearInterval(this.interval);
      };
    }

    HashbangNavigator.prototype.pushState = function(stateObject, title, path) {
      return window.location.hash = this.linkTo(path);
    };

    HashbangNavigator.prototype.replaceState = function(stateObject, title, path) {
      var loc;
      loc = window.location;
      return loc.replace("" + loc.pathname + loc.search + (this.linkTo(path)));
    };

    HashbangNavigator.prototype.linkTo = function(url) {
      return this.HASH_PREFIX + url;
    };

    HashbangNavigator.prototype.pathFromLocation = function(location) {
      var hash;
      hash = location.hash;
      if ((hash != null ? hash.substr(0, 2) : void 0) === this.HASH_PREFIX) {
        return this.normalizePath(hash.substr(2));
      } else {
        return '/';
      }
    };

    HashbangNavigator.prototype.handleLocation = function(location) {
      var realPath;
      if (!Batman.config.usePushState) {
        return HashbangNavigator.__super__.handleLocation.apply(this, arguments);
      }
      realPath = Batman.PushStateNavigator.prototype.pathFromLocation(location);
      if (realPath === '/') {
        return HashbangNavigator.__super__.handleLocation.apply(this, arguments);
      } else {
        return location.replace(this.normalizePath("" + Batman.config.pathPrefix + (this.linkTo(realPath))));
      }
    };

    return HashbangNavigator;

  })(Batman.Navigator);

}).call(this);

(function() {

  Batman.RouteMap = (function() {

    RouteMap.prototype.memberRoute = null;

    RouteMap.prototype.collectionRoute = null;

    function RouteMap() {
      this.childrenByOrder = [];
      this.childrenByName = {};
    }

    RouteMap.prototype.routeForParams = function(params) {
      var route, _i, _len, _ref;
      _ref = this.childrenByOrder;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        route = _ref[_i];
        if (route.test(params)) {
          return route;
        }
      }
      return void 0;
    };

    RouteMap.prototype.addRoute = function(name, route) {
      var base, names,
        _this = this;
      this.childrenByOrder.push(route);
      if (name.length > 0 && (names = name.split('.')).length > 0) {
        base = names.shift();
        if (!this.childrenByName[base]) {
          this.childrenByName[base] = new Batman.RouteMap;
        }
        this.childrenByName[base].addRoute(names.join('.'), route);
      } else {
        if (route.get('member')) {
          Batman.developer["do"](function() {
            if (_this.memberRoute) {
              return Batman.developer.error("Member route with name " + name + " already exists!");
            }
          });
          this.memberRoute = route;
        } else {
          Batman.developer["do"](function() {
            if (_this.collectionRoute) {
              return Batman.developer.error("Collection route with name " + name + " already exists!");
            }
          });
          this.collectionRoute = route;
        }
      }
      return true;
    };

    return RouteMap;

  })();

}).call(this);

(function() {
  var __slice = [].slice;

  Batman.RouteMapBuilder = (function() {

    RouteMapBuilder.BUILDER_FUNCTIONS = ['resources', 'member', 'collection', 'route', 'root'];

    RouteMapBuilder.ROUTES = {
      index: {
        cardinality: 'collection',
        path: function(resource) {
          return resource;
        },
        name: function(resource) {
          return resource;
        }
      },
      "new": {
        cardinality: 'collection',
        path: function(resource) {
          return "" + resource + "/new";
        },
        name: function(resource) {
          return "" + resource + ".new";
        }
      },
      show: {
        cardinality: 'member',
        path: function(resource) {
          return "" + resource + "/:id";
        },
        name: function(resource) {
          return resource;
        }
      },
      edit: {
        cardinality: 'member',
        path: function(resource) {
          return "" + resource + "/:id/edit";
        },
        name: function(resource) {
          return "" + resource + ".edit";
        }
      },
      collection: {
        cardinality: 'collection',
        path: function(resource, name) {
          return "" + resource + "/" + name;
        },
        name: function(resource, name) {
          return "" + resource + "." + name;
        }
      },
      member: {
        cardinality: 'member',
        path: function(resource, name) {
          return "" + resource + "/:id/" + name;
        },
        name: function(resource, name) {
          return "" + resource + "." + name;
        }
      }
    };

    function RouteMapBuilder(app, routeMap, parent, baseOptions) {
      this.app = app;
      this.routeMap = routeMap;
      this.parent = parent;
      this.baseOptions = baseOptions != null ? baseOptions : {};
      if (this.parent) {
        this.rootPath = this.parent._nestingPath();
        this.rootName = this.parent._nestingName();
      } else {
        this.rootPath = '';
        this.rootName = '';
      }
    }

    RouteMapBuilder.prototype.resources = function() {
      var action, actions, arg, args, as, callback, childBuilder, controller, included, k, options, path, resourceName, resourceNames, resourceRoot, routeOptions, routeTemplate, v, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      resourceNames = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          arg = args[_i];
          if (typeof arg === 'string') {
            _results.push(arg);
          }
        }
        return _results;
      })();
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }
      if (typeof args[args.length - 1] === 'object') {
        options = args.pop();
      } else {
        options = {};
      }
      actions = {
        index: true,
        "new": true,
        show: true,
        edit: true
      };
      if (options.except) {
        _ref = options.except;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          k = _ref[_i];
          actions[k] = false;
        }
        delete options.except;
      } else if (options.only) {
        for (k in actions) {
          v = actions[k];
          actions[k] = false;
        }
        _ref1 = options.only;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          k = _ref1[_j];
          actions[k] = true;
        }
        delete options.only;
      }
      for (_k = 0, _len2 = resourceNames.length; _k < _len2; _k++) {
        resourceName = resourceNames[_k];
        resourceRoot = Batman.helpers.pluralize(resourceName);
        controller = Batman.helpers.camelize(resourceRoot, true);
        childBuilder = this._childBuilder({
          controller: controller
        });
        if (callback != null) {
          callback.call(childBuilder);
        }
        for (action in actions) {
          included = actions[action];
          if (!(included)) {
            continue;
          }
          routeTemplate = this.constructor.ROUTES[action];
          as = routeTemplate.name(resourceRoot);
          path = routeTemplate.path(resourceRoot);
          routeOptions = Batman.extend({
            controller: controller,
            action: action,
            path: path,
            as: as
          }, options);
          childBuilder[routeTemplate.cardinality](action, routeOptions);
        }
      }
      return true;
    };

    RouteMapBuilder.prototype.member = function() {
      return this._addRoutesWithCardinality.apply(this, ['member'].concat(__slice.call(arguments)));
    };

    RouteMapBuilder.prototype.collection = function() {
      return this._addRoutesWithCardinality.apply(this, ['collection'].concat(__slice.call(arguments)));
    };

    RouteMapBuilder.prototype.root = function(signature, options) {
      return this.route('/', signature, options);
    };

    RouteMapBuilder.prototype.route = function(path, signature, options, callback) {
      if (!callback) {
        if (typeof options === 'function') {
          callback = options;
          options = void 0;
        } else if (typeof signature === 'function') {
          callback = signature;
          signature = void 0;
        }
      }
      if (!options) {
        if (typeof signature === 'string') {
          options = {
            signature: signature
          };
        } else {
          options = signature;
        }
        options || (options = {});
      } else {
        if (signature) {
          options.signature = signature;
        }
      }
      if (callback) {
        options.callback = callback;
      }
      options.as || (options.as = this._nameFromPath(path));
      options.path = path;
      return this._addRoute(options);
    };

    RouteMapBuilder.prototype._addRoutesWithCardinality = function() {
      var cardinality, name, names, options, resourceRoot, routeOptions, routeTemplate, _i, _j, _len;
      cardinality = arguments[0], names = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), options = arguments[_i++];
      if (typeof options === 'string') {
        names.push(options);
        options = {};
      }
      options = Batman.extend({}, this.baseOptions, options);
      options[cardinality] = true;
      routeTemplate = this.constructor.ROUTES[cardinality];
      resourceRoot = Batman.helpers.underscore(options.controller);
      for (_j = 0, _len = names.length; _j < _len; _j++) {
        name = names[_j];
        routeOptions = Batman.extend({
          action: name
        }, options);
        if (routeOptions.path == null) {
          routeOptions.path = routeTemplate.path(resourceRoot, name);
        }
        if (routeOptions.as == null) {
          routeOptions.as = routeTemplate.name(resourceRoot, name);
        }
        this._addRoute(routeOptions);
      }
      return true;
    };

    RouteMapBuilder.prototype._addRoute = function(options) {
      var klass, name, path, route;
      if (options == null) {
        options = {};
      }
      path = this.rootPath + options.path;
      name = this.rootName + Batman.helpers.camelize(options.as, true);
      delete options.as;
      delete options.path;
      klass = options.callback ? Batman.CallbackActionRoute : Batman.ControllerActionRoute;
      options.app = this.app;
      route = new klass(path, options);
      return this.routeMap.addRoute(name, route);
    };

    RouteMapBuilder.prototype._nameFromPath = function(path) {
      path = path.replace(Batman.Route.regexps.namedOrSplat, '').replace(/\/+/g, '.').replace(/(^\.)|(\.$)/g, '');
      return path;
    };

    RouteMapBuilder.prototype._nestingPath = function() {
      var nestingParam, nestingSegment;
      if (!this.parent) {
        return "";
      } else {
        nestingParam = ":" + Batman.helpers.singularize(this.baseOptions.controller) + "Id";
        nestingSegment = Batman.helpers.underscore(this.baseOptions.controller);
        return "" + (this.parent._nestingPath()) + nestingSegment + "/" + nestingParam + "/";
      }
    };

    RouteMapBuilder.prototype._nestingName = function() {
      if (!this.parent) {
        return "";
      } else {
        return this.parent._nestingName() + this.baseOptions.controller + ".";
      }
    };

    RouteMapBuilder.prototype._childBuilder = function(baseOptions) {
      if (baseOptions == null) {
        baseOptions = {};
      }
      return new Batman.RouteMapBuilder(this.app, this.routeMap, this, baseOptions);
    };

    return RouteMapBuilder;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.App = (function(_super) {
    var name, _fn, _i, _len, _ref,
      _this = this;

    __extends(App, _super);

    function App() {
      return App.__super__.constructor.apply(this, arguments);
    }

    App.classAccessor('currentParams', {
      get: function() {
        return new Batman.Hash;
      },
      'final': true
    });

    App.classAccessor('paramsManager', {
      get: function() {
        var nav, params;
        if (!(nav = this.get('navigator'))) {
          return;
        }
        params = this.get('currentParams');
        return params.replacer = new Batman.ParamsReplacer(nav, params);
      },
      'final': true
    });

    App.classAccessor('paramsPusher', {
      get: function() {
        var nav, params;
        if (!(nav = this.get('navigator'))) {
          return;
        }
        params = this.get('currentParams');
        return params.pusher = new Batman.ParamsPusher(nav, params);
      },
      'final': true
    });

    App.classAccessor('routes', function() {
      return new Batman.NamedRouteQuery(this.get('routeMap'));
    });

    App.classAccessor('routeMap', function() {
      return new Batman.RouteMap;
    });

    App.classAccessor('routeMapBuilder', function() {
      return new Batman.RouteMapBuilder(this, this.get('routeMap'));
    });

    App.classAccessor('dispatcher', function() {
      return new Batman.Dispatcher(this, this.get('routeMap'));
    });

    App.classAccessor('controllers', function() {
      return this.get('dispatcher.controllers');
    });

    App.classAccessor('_renderContext', function() {
      return Batman.RenderContext.base.descend(this);
    });

    App.requirePath = '';

    Batman.developer["do"](function() {
      var requireDeprecated;
      requireDeprecated = "Please use whatever means you'd like to load your code before calling App.run.";
      App.require = function() {
        var base, name, names, path, _i, _len,
          _this = this;
        path = arguments[0], names = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        Batman.developer.deprecated("App.require", requireDeprecated);
        base = this.requirePath + path;
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          this.prevent('run');
          path = base + '/' + name + '.coffee';
          new Batman.Request({
            url: path,
            type: 'html',
            success: function(response) {
              CoffeeScript["eval"](response);
              _this.allow('run');
              if (!_this.isPrevented('run')) {
                _this.fire('loaded');
              }
              if (_this.wantsToRun) {
                return _this.run();
              }
            }
          });
        }
        return this;
      };
      App.controller = function() {
        var names;
        names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        Batman.developer.deprecated("App.controller", requireDeprecated);
        names = names.map(function(n) {
          return n + '_controller';
        });
        return this.require.apply(this, ['controllers'].concat(__slice.call(names)));
      };
      App.model = function() {
        Batman.developer.deprecated("App.model", requireDeprecated);
        return this.require.apply(this, ['models'].concat(__slice.call(arguments)));
      };
      return App.view = function() {
        Batman.developer.deprecated("App.view", requireDeprecated);
        return this.require.apply(this, ['views'].concat(__slice.call(arguments)));
      };
    });

    App.layout = void 0;

    App.shouldAllowEvent = {};

    _ref = Batman.RouteMapBuilder.BUILDER_FUNCTIONS;
    _fn = function(name) {
      return App[name] = function() {
        var _ref1;
        return (_ref1 = this.get('routeMapBuilder'))[name].apply(_ref1, arguments);
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      _fn(name);
    }

    App.event('ready').oneShot = true;

    App.event('run').oneShot = true;

    App.run = function() {
      var layout, layoutClass,
        _this = this;
      if (Batman.currentApp) {
        if (Batman.currentApp === this) {
          return;
        }
        Batman.currentApp.stop();
      }
      if (this.hasRun) {
        return false;
      }
      if (this.isPrevented('run')) {
        this.wantsToRun = true;
        return false;
      } else {
        delete this.wantsToRun;
      }
      Batman.currentApp = this;
      Batman.App.set('current', this);
      if (this.get('dispatcher') == null) {
        this.set('dispatcher', new Batman.Dispatcher(this, this.get('routeMap')));
        this.set('controllers', this.get('dispatcher.controllers'));
      }
      if (this.get('navigator') == null) {
        this.set('navigator', Batman.Navigator.forApp(this));
        this.on('run', function() {
          Batman.navigator = _this.get('navigator');
          if (Object.keys(_this.get('dispatcher').routeMap).length > 0) {
            return Batman.navigator.start();
          }
        });
      }
      this.observe('layout', function(layout) {
        return layout != null ? layout.on('ready', function() {
          return _this.fire('ready');
        }) : void 0;
      });
      layout = this.get('layout');
      if (layout) {
        if (typeof layout === 'string') {
          layoutClass = this[Batman.helpers.camelize(layout) + 'View'];
        }
      } else {
        if (layout !== null) {
          layoutClass = Batman.View;
        }
      }
      if (layoutClass) {
        layout = this.set('layout', new layoutClass({
          context: this,
          node: document
        }));
      }
      this.hasRun = true;
      this.fire('run');
      return this;
    };

    App.event('ready').oneShot = true;

    App.event('stop').oneShot = true;

    App.stop = function() {
      var _ref1;
      if ((_ref1 = this.navigator) != null) {
        _ref1.stop();
      }
      Batman.navigator = null;
      this.hasRun = false;
      this.fire('stop');
      return this;
    };

    return App;

  }).call(this, Batman.Object);

}).call(this);

(function() {

  Batman.Association = (function() {

    Association.prototype.associationType = '';

    Association.prototype.isPolymorphic = false;

    Association.prototype.defaultOptions = {
      saveInline: true,
      autoload: true,
      nestUrl: false
    };

    function Association(model, label, options) {
      var defaultOptions, encoder, getAccessor, self;
      this.model = model;
      this.label = label;
      if (options == null) {
        options = {};
      }
      defaultOptions = {
        namespace: Batman.currentApp,
        name: Batman.helpers.camelize(Batman.helpers.singularize(this.label))
      };
      this.options = Batman.extend(defaultOptions, this.defaultOptions, options);
      if (this.options.nestUrl) {
        if (!(this.model.urlNestsUnder != null)) {
          Batman.developer.error("You must persist the the model " + this.model.constructor.name + " to use the url helpers on an association");
        }
        this.model.urlNestsUnder(Batman.helpers.underscore(this.getRelatedModel().get('resourceName')));
      }
      if (this.options.extend != null) {
        Batman.extend(this, this.options.extend);
      }
      encoder = {
        encode: this.options.saveInline ? this.encoder() : false,
        decode: this.decoder()
      };
      this.model.encode(this.label, encoder);
      self = this;
      getAccessor = function() {
        return self.getAccessor.call(this, self, this.model, this.label);
      };
      this.model.accessor(this.label, {
        get: getAccessor,
        set: model.defaultAccessor.set,
        unset: model.defaultAccessor.unset
      });
    }

    Association.prototype.getRelatedModel = function() {
      var className, relatedModel, scope;
      scope = this.options.namespace || Batman.currentApp;
      className = this.options.name;
      relatedModel = scope != null ? scope[className] : void 0;
      Batman.developer["do"](function() {
        if ((Batman.currentApp != null) && !relatedModel) {
          return Batman.developer.warn("Related model " + className + " hasn't loaded yet.");
        }
      });
      return relatedModel;
    };

    Association.prototype.getFromAttributes = function(record) {
      return record.get("attributes." + this.label);
    };

    Association.prototype.setIntoAttributes = function(record, value) {
      return record.get('attributes').set(this.label, value);
    };

    Association.prototype.inverse = function() {
      var inverse, relatedAssocs,
        _this = this;
      if (relatedAssocs = this.getRelatedModel()._batman.get('associations')) {
        if (this.options.inverseOf) {
          return relatedAssocs.getByLabel(this.options.inverseOf);
        }
        inverse = null;
        relatedAssocs.forEach(function(label, assoc) {
          if (assoc.getRelatedModel() === _this.model) {
            return inverse = assoc;
          }
        });
        return inverse;
      }
    };

    Association.prototype.reset = function() {
      delete this.index;
      return true;
    };

    return Association;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PluralAssociation = (function(_super) {

    __extends(PluralAssociation, _super);

    PluralAssociation.prototype.proxyClass = Batman.AssociationSet;

    PluralAssociation.prototype.isSingular = false;

    function PluralAssociation() {
      PluralAssociation.__super__.constructor.apply(this, arguments);
      this._resetSetHashes();
    }

    PluralAssociation.prototype.setForRecord = function(record) {
      var childModelSetIndex, indexValue,
        _this = this;
      indexValue = this.indexValueForRecord(record);
      childModelSetIndex = this.setIndex();
      Batman.Property.withoutTracking(function() {
        return _this._setsByRecord.getOrSet(record, function() {
          var existingValueSet, newSet;
          if (indexValue != null) {
            existingValueSet = _this._setsByValue.get(indexValue);
            if (existingValueSet != null) {
              return existingValueSet;
            }
          }
          newSet = _this.proxyClassInstanceForKey(indexValue);
          if (indexValue != null) {
            _this._setsByValue.set(indexValue, newSet);
          }
          return newSet;
        });
      });
      if (indexValue != null) {
        return childModelSetIndex.get(indexValue);
      } else {
        return this._setsByRecord.get(record);
      }
    };

    PluralAssociation.prototype.setForKey = Batman.Property.wrapTrackingPrevention(function(indexValue) {
      var foundSet,
        _this = this;
      foundSet = void 0;
      this._setsByRecord.forEach(function(record, set) {
        if (foundSet != null) {
          return;
        }
        if (_this.indexValueForRecord(record) === indexValue) {
          return foundSet = set;
        }
      });
      if (foundSet != null) {
        foundSet.foreignKeyValue = indexValue;
        return foundSet;
      }
      return this._setsByValue.getOrSet(indexValue, function() {
        return _this.proxyClassInstanceForKey(indexValue);
      });
    });

    PluralAssociation.prototype.proxyClassInstanceForKey = function(indexValue) {
      return new this.proxyClass(indexValue, this);
    };

    PluralAssociation.prototype.getAccessor = function(self, model, label) {
      var relatedRecords, setInAttributes,
        _this = this;
      if (!self.getRelatedModel()) {
        return;
      }
      if (setInAttributes = self.getFromAttributes(this)) {
        return setInAttributes;
      } else {
        relatedRecords = self.setForRecord(this);
        self.setIntoAttributes(this, relatedRecords);
        Batman.Property.withoutTracking(function() {
          if (self.options.autoload && !_this.isNew() && !relatedRecords.loaded) {
            return relatedRecords.load(function(error, records) {
              if (error) {
                throw error;
              }
            });
          }
        });
        return relatedRecords;
      }
    };

    PluralAssociation.prototype.parentSetIndex = function() {
      this.parentIndex || (this.parentIndex = this.model.get('loaded').indexedByUnique(this.primaryKey));
      return this.parentIndex;
    };

    PluralAssociation.prototype.setIndex = function() {
      this.index || (this.index = new Batman.AssociationSetIndex(this, this[this.indexRelatedModelOn]));
      return this.index;
    };

    PluralAssociation.prototype.indexValueForRecord = function(record) {
      return record.get(this.primaryKey);
    };

    PluralAssociation.prototype.reset = function() {
      PluralAssociation.__super__.reset.apply(this, arguments);
      return this._resetSetHashes();
    };

    PluralAssociation.prototype._resetSetHashes = function() {
      this._setsByRecord = new Batman.SimpleHash;
      return this._setsByValue = new Batman.SimpleHash;
    };

    return PluralAssociation;

  })(Batman.Association);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.HasManyAssociation = (function(_super) {

    __extends(HasManyAssociation, _super);

    HasManyAssociation.prototype.associationType = 'hasMany';

    HasManyAssociation.prototype.indexRelatedModelOn = 'foreignKey';

    function HasManyAssociation(model, label, options) {
      if (options != null ? options.as : void 0) {
        return (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args), t = typeof result;
          return t == "object" || t == "function" ? result || child : child;
        })(Batman.PolymorphicHasManyAssociation, arguments, function(){});
      }
      HasManyAssociation.__super__.constructor.apply(this, arguments);
      this.primaryKey = this.options.primaryKey || "id";
      this.foreignKey = this.options.foreignKey || ("" + (Batman.helpers.underscore(model.get('resourceName'))) + "_id");
    }

    HasManyAssociation.prototype.apply = function(baseSaveError, base) {
      var relations, set,
        _this = this;
      if (!baseSaveError) {
        if (relations = this.getFromAttributes(base)) {
          relations.forEach(function(model) {
            return model.set(_this.foreignKey, base.get(_this.primaryKey));
          });
        }
        base.set(this.label, set = this.setForRecord(base));
        if (base.lifecycle.get('state') === 'creating') {
          return set.markAsLoaded();
        }
      }
    };

    HasManyAssociation.prototype.encoder = function() {
      var association;
      association = this;
      return function(relationSet, _, __, record) {
        var jsonArray;
        if (relationSet != null) {
          jsonArray = [];
          relationSet.forEach(function(relation) {
            var relationJSON;
            relationJSON = relation.toJSON();
            if (!association.inverse() || association.inverse().options.encodeForeignKey) {
              relationJSON[association.foreignKey] = record.get(association.primaryKey);
            }
            return jsonArray.push(relationJSON);
          });
        }
        return jsonArray;
      };
    };

    HasManyAssociation.prototype.decoder = function() {
      var association;
      association = this;
      return function(data, key, _, __, parentRecord) {
        var existingRecord, existingRelations, jsonObject, newRelations, record, relatedModel, savedRecord, _i, _len;
        if (relatedModel = association.getRelatedModel()) {
          existingRelations = association.getFromAttributes(parentRecord) || association.setForRecord(parentRecord);
          newRelations = existingRelations.filter(function(relation) {
            return relation.isNew();
          }).toArray();
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            jsonObject = data[_i];
            record = new relatedModel();
            record._withoutDirtyTracking(function() {
              return this.fromJSON(jsonObject);
            });
            existingRecord = relatedModel.get('loaded').indexedByUnique('id').get(record.get('id'));
            if (existingRecord != null) {
              existingRecord._withoutDirtyTracking(function() {
                return this.fromJSON(jsonObject);
              });
              record = existingRecord;
            } else {
              if (newRelations.length > 0) {
                savedRecord = newRelations.shift();
                savedRecord._withoutDirtyTracking(function() {
                  return this.fromJSON(jsonObject);
                });
                record = savedRecord;
              }
            }
            record = relatedModel._mapIdentity(record);
            existingRelations.add(record);
            if (association.options.inverseOf) {
              record.set(association.options.inverseOf, parentRecord);
            }
          }
          existingRelations.markAsLoaded();
        } else {
          Batman.developer.error("Can't decode model " + association.options.name + " because it hasn't been loaded yet!");
        }
        return existingRelations;
      };
    };

    return HasManyAssociation;

  })(Batman.PluralAssociation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicHasManyAssociation = (function(_super) {

    __extends(PolymorphicHasManyAssociation, _super);

    PolymorphicHasManyAssociation.prototype.proxyClass = Batman.PolymorphicAssociationSet;

    PolymorphicHasManyAssociation.prototype.isPolymorphic = true;

    function PolymorphicHasManyAssociation(model, label, options) {
      options.inverseOf = this.foreignLabel = options.as;
      delete options.as;
      options.foreignKey || (options.foreignKey = "" + this.foreignLabel + "_id");
      PolymorphicHasManyAssociation.__super__.constructor.call(this, model, label, options);
      this.foreignTypeKey = options.foreignTypeKey || ("" + this.foreignLabel + "_type");
      this.model.encode(this.foreignTypeKey);
    }

    PolymorphicHasManyAssociation.prototype.apply = function(baseSaveError, base) {
      var relations,
        _this = this;
      if (!baseSaveError) {
        if (relations = this.getFromAttributes(base)) {
          PolymorphicHasManyAssociation.__super__.apply.apply(this, arguments);
          relations.forEach(function(model) {
            return model.set(_this.foreignTypeKey, _this.modelType());
          });
        }
      }
      return true;
    };

    PolymorphicHasManyAssociation.prototype.proxyClassInstanceForKey = function(indexValue) {
      return new this.proxyClass(indexValue, this.modelType(), this);
    };

    PolymorphicHasManyAssociation.prototype.getRelatedModelForType = function(type) {
      var relatedModel, scope;
      scope = this.options.namespace || Batman.currentApp;
      if (type) {
        relatedModel = scope != null ? scope[type] : void 0;
        relatedModel || (relatedModel = scope != null ? scope[Batman.helpers.camelize(type)] : void 0);
      } else {
        relatedModel = this.getRelatedModel();
      }
      Batman.developer["do"](function() {
        if ((Batman.currentApp != null) && !relatedModel) {
          return Batman.developer.warn("Related model " + type + " for polymorphic association not found.");
        }
      });
      return relatedModel;
    };

    PolymorphicHasManyAssociation.prototype.modelType = function() {
      return this.model.get('resourceName');
    };

    PolymorphicHasManyAssociation.prototype.setIndex = function() {
      this.typeIndex || (this.typeIndex = new Batman.PolymorphicAssociationSetIndex(this, this.modelType(), this[this.indexRelatedModelOn]));
      return this.typeIndex;
    };

    PolymorphicHasManyAssociation.prototype.encoder = function() {
      var association;
      association = this;
      return function(relationSet, _, __, record) {
        var jsonArray;
        if (relationSet != null) {
          jsonArray = [];
          relationSet.forEach(function(relation) {
            var relationJSON;
            relationJSON = relation.toJSON();
            relationJSON[association.foreignKey] = record.get(association.primaryKey);
            relationJSON[association.foreignTypeKey] = association.modelType();
            return jsonArray.push(relationJSON);
          });
        }
        return jsonArray;
      };
    };

    PolymorphicHasManyAssociation.prototype.decoder = function() {
      var association;
      association = this;
      return function(data, key, _, __, parentRecord) {
        var existingRecord, existingRelations, jsonObject, newRelations, record, relatedModel, savedRecord, subType, type, _i, _len;
        if (relatedModel = association.getRelatedModel()) {
          existingRelations = association.getFromAttributes(parentRecord) || association.setForRecord(parentRecord);
          newRelations = existingRelations.filter(function(relation) {
            return relation.isNew();
          }).toArray();
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            jsonObject = data[_i];
            type = jsonObject[association.options.foreignTypeKey];
            subType = association.getRelatedModelForType(type);
            record = new subType();
            record._withoutDirtyTracking(function() {
              return this.fromJSON(jsonObject);
            });
            existingRecord = relatedModel.get('loaded').indexedByUnique('id').get(record.get('id'));
            if (existingRecord != null) {
              existingRecord._withoutDirtyTracking(function() {
                return this.fromJSON(jsonObject);
              });
              record = existingRecord;
            } else {
              if (newRelations.length > 0) {
                savedRecord = newRelations.shift();
                savedRecord._withoutDirtyTracking(function() {
                  return this.fromJSON(jsonObject);
                });
                record = savedRecord;
              }
            }
            record = relatedModel._mapIdentity(record);
            existingRelations.add(record);
            if (association.options.inverseOf) {
              record.set(association.options.inverseOf, parentRecord);
            }
          }
          existingRelations.markAsLoaded();
        } else {
          Batman.developer.error("Can't decode model " + association.options.name + " because it hasn't been loaded yet!");
        }
        return existingRelations;
      };
    };

    return PolymorphicHasManyAssociation;

  })(Batman.HasManyAssociation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.SingularAssociation = (function(_super) {

    __extends(SingularAssociation, _super);

    function SingularAssociation() {
      return SingularAssociation.__super__.constructor.apply(this, arguments);
    }

    SingularAssociation.prototype.isSingular = true;

    SingularAssociation.prototype.getAccessor = function(self, model, label) {
      var parent, proxy, record, recordInAttributes, _ref;
      if (recordInAttributes = self.getFromAttributes(this)) {
        return recordInAttributes;
      }
      if (self.getRelatedModel()) {
        proxy = this.associationProxy(self);
        record = false;
        parent = this;
        if ((_ref = proxy._loadSetter) == null) {
          proxy._loadSetter = proxy.once('loaded', function(child) {
            return parent._withoutDirtyTracking(function() {
              return this.set(self.label, child);
            });
          });
        }
        if (!Batman.Property.withoutTracking(function() {
          return proxy.get('loaded');
        })) {
          if (self.options.autoload) {
            Batman.Property.withoutTracking(function() {
              return proxy.load();
            });
          } else {
            record = proxy.loadFromLocal();
          }
        }
        return record || proxy;
      }
    };

    SingularAssociation.prototype.setIndex = function() {
      this.index || (this.index = new Batman.UniqueAssociationSetIndex(this, this[this.indexRelatedModelOn]));
      return this.index;
    };

    return SingularAssociation;

  })(Batman.Association);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.HasOneAssociation = (function(_super) {

    __extends(HasOneAssociation, _super);

    HasOneAssociation.prototype.associationType = 'hasOne';

    HasOneAssociation.prototype.proxyClass = Batman.HasOneProxy;

    HasOneAssociation.prototype.indexRelatedModelOn = 'foreignKey';

    function HasOneAssociation() {
      HasOneAssociation.__super__.constructor.apply(this, arguments);
      this.primaryKey = this.options.primaryKey || "id";
      this.foreignKey = this.options.foreignKey || ("" + (Batman.helpers.underscore(this.model.get('resourceName'))) + "_id");
    }

    HasOneAssociation.prototype.apply = function(baseSaveError, base) {
      var relation;
      if (relation = this.getFromAttributes(base)) {
        return relation.set(this.foreignKey, base.get(this.primaryKey));
      }
    };

    HasOneAssociation.prototype.encoder = function() {
      var association;
      association = this;
      return function(val, key, object, record) {
        var json;
        if (!association.options.saveInline) {
          return;
        }
        if (json = val.toJSON()) {
          json[association.foreignKey] = record.get(association.primaryKey);
        }
        return json;
      };
    };

    HasOneAssociation.prototype.decoder = function() {
      var association;
      association = this;
      return function(data, _, __, ___, parentRecord) {
        var record, relatedModel;
        if (!data) {
          return;
        }
        relatedModel = association.getRelatedModel();
        record = relatedModel.createFromJSON(data);
        if (association.options.inverseOf) {
          record.set(association.options.inverseOf, parentRecord);
        }
        return record;
      };
    };

    return HasOneAssociation;

  })(Batman.SingularAssociation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.BelongsToAssociation = (function(_super) {

    __extends(BelongsToAssociation, _super);

    BelongsToAssociation.prototype.associationType = 'belongsTo';

    BelongsToAssociation.prototype.proxyClass = Batman.BelongsToProxy;

    BelongsToAssociation.prototype.indexRelatedModelOn = 'primaryKey';

    BelongsToAssociation.prototype.defaultOptions = {
      saveInline: false,
      autoload: true,
      encodeForeignKey: true
    };

    function BelongsToAssociation(model, label, options) {
      if (options != null ? options.polymorphic : void 0) {
        delete options.polymorphic;
        return (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args), t = typeof result;
          return t == "object" || t == "function" ? result || child : child;
        })(Batman.PolymorphicBelongsToAssociation, arguments, function(){});
      }
      BelongsToAssociation.__super__.constructor.apply(this, arguments);
      this.foreignKey = this.options.foreignKey || ("" + this.label + "_id");
      this.primaryKey = this.options.primaryKey || "id";
      if (this.options.encodeForeignKey) {
        this.model.encode(this.foreignKey);
      }
    }

    BelongsToAssociation.prototype.encoder = function() {
      return function(val) {
        return val.toJSON();
      };
    };

    BelongsToAssociation.prototype.decoder = function() {
      var association;
      association = this;
      return function(data, _, __, ___, childRecord) {
        var inverse, record, relatedModel;
        relatedModel = association.getRelatedModel();
        record = relatedModel.createFromJSON(data);
        if (association.options.inverseOf) {
          if (inverse = association.inverse()) {
            if (inverse instanceof Batman.HasManyAssociation) {
              childRecord.set(association.foreignKey, record.get(association.primaryKey));
            } else {
              record.set(inverse.label, childRecord);
            }
          }
        }
        childRecord.set(association.label, record);
        return record;
      };
    };

    BelongsToAssociation.prototype.apply = function(base) {
      var foreignValue, model;
      if (model = base.get(this.label)) {
        foreignValue = model.get(this.primaryKey);
        if (foreignValue !== void 0) {
          return base.set(this.foreignKey, foreignValue);
        }
      }
    };

    return BelongsToAssociation;

  })(Batman.SingularAssociation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PolymorphicBelongsToAssociation = (function(_super) {

    __extends(PolymorphicBelongsToAssociation, _super);

    PolymorphicBelongsToAssociation.prototype.isPolymorphic = true;

    PolymorphicBelongsToAssociation.prototype.proxyClass = Batman.PolymorphicBelongsToProxy;

    PolymorphicBelongsToAssociation.prototype.defaultOptions = Batman.mixin({}, Batman.BelongsToAssociation.prototype.defaultOptions, {
      encodeForeignTypeKey: true
    });

    function PolymorphicBelongsToAssociation() {
      PolymorphicBelongsToAssociation.__super__.constructor.apply(this, arguments);
      this.foreignTypeKey = this.options.foreignTypeKey || ("" + this.label + "_type");
      if (this.options.encodeForeignTypeKey) {
        this.model.encode(this.foreignTypeKey);
      }
      this.typeIndicies = {};
    }

    PolymorphicBelongsToAssociation.prototype.getRelatedModel = false;

    PolymorphicBelongsToAssociation.prototype.setIndex = false;

    PolymorphicBelongsToAssociation.prototype.inverse = false;

    PolymorphicBelongsToAssociation.prototype.apply = function(base) {
      var foreignTypeValue, instanceOrProxy;
      PolymorphicBelongsToAssociation.__super__.apply.apply(this, arguments);
      if (instanceOrProxy = base.get(this.label)) {
        foreignTypeValue = instanceOrProxy instanceof Batman.PolymorphicBelongsToProxy ? instanceOrProxy.get('foreignTypeValue') : instanceOrProxy.constructor.get('resourceName');
        return base.set(this.foreignTypeKey, foreignTypeValue);
      }
    };

    PolymorphicBelongsToAssociation.prototype.getAccessor = function(self, model, label) {
      var proxy, recordInAttributes;
      if (recordInAttributes = self.getFromAttributes(this)) {
        return recordInAttributes;
      }
      if (self.getRelatedModelForType(this.get(self.foreignTypeKey))) {
        proxy = this.associationProxy(self);
        Batman.Property.withoutTracking(function() {
          if (!proxy.get('loaded') && self.options.autoload) {
            return proxy.load();
          }
        });
        return proxy;
      }
    };

    PolymorphicBelongsToAssociation.prototype.url = function(recordOptions) {
      var ending, helper, id, inverse, root, type, _ref, _ref1;
      type = (_ref = recordOptions.data) != null ? _ref[this.foreignTypeKey] : void 0;
      if (type && (inverse = this.inverseForType(type))) {
        root = Batman.helpers.pluralize(type).toLowerCase();
        id = (_ref1 = recordOptions.data) != null ? _ref1[this.foreignKey] : void 0;
        helper = inverse.isSingular ? "singularize" : "pluralize";
        ending = Batman.helpers[helper](inverse.label);
        return "/" + root + "/" + id + "/" + ending;
      }
    };

    PolymorphicBelongsToAssociation.prototype.getRelatedModelForType = function(type) {
      var relatedModel, scope;
      scope = this.options.namespace || Batman.currentApp;
      if (type) {
        relatedModel = scope != null ? scope[type] : void 0;
        relatedModel || (relatedModel = scope != null ? scope[Batman.helpers.camelize(type)] : void 0);
      }
      Batman.developer["do"](function() {
        if ((Batman.currentApp != null) && !relatedModel) {
          return Batman.developer.warn("Related model " + type + " for polymorphic association not found.");
        }
      });
      return relatedModel;
    };

    PolymorphicBelongsToAssociation.prototype.setIndexForType = function(type) {
      var _base;
      (_base = this.typeIndicies)[type] || (_base[type] = new Batman.PolymorphicUniqueAssociationSetIndex(this, type, this.primaryKey));
      return this.typeIndicies[type];
    };

    PolymorphicBelongsToAssociation.prototype.inverseForType = function(type) {
      var inverse, relatedAssocs, _ref,
        _this = this;
      if (relatedAssocs = (_ref = this.getRelatedModelForType(type)) != null ? _ref._batman.get('associations') : void 0) {
        if (this.options.inverseOf) {
          return relatedAssocs.getByLabel(this.options.inverseOf);
        }
        inverse = null;
        relatedAssocs.forEach(function(label, assoc) {
          if (assoc.getRelatedModel() === _this.model) {
            return inverse = assoc;
          }
        });
        return inverse;
      }
    };

    PolymorphicBelongsToAssociation.prototype.decoder = function() {
      var association;
      association = this;
      return function(data, key, response, ___, childRecord) {
        var foreignTypeValue, inverse, record, relatedModel;
        foreignTypeValue = response[association.foreignTypeKey] || childRecord.get(association.foreignTypeKey);
        relatedModel = association.getRelatedModelForType(foreignTypeValue);
        record = relatedModel.createFromJSON(data);
        if (association.options.inverseOf) {
          if (inverse = association.inverseForType(foreignTypeValue)) {
            if (inverse instanceof Batman.PolymorphicHasManyAssociation) {
              childRecord.set(association.foreignKey, record.get(association.primaryKey));
              childRecord.set(association.foreignTypeKey, foreignTypeValue);
            } else {
              record.set(inverse.label, childRecord);
            }
          }
        }
        childRecord.set(association.label, record);
        return record;
      };
    };

    return PolymorphicBelongsToAssociation;

  })(Batman.BelongsToAssociation);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.Validator = (function(_super) {

    __extends(Validator, _super);

    Validator.triggers = function() {
      var triggers;
      triggers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this._triggers != null) {
        return this._triggers.concat(triggers);
      } else {
        return this._triggers = triggers;
      }
    };

    Validator.options = function() {
      var options;
      options = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this._options != null) {
        return this._options.concat(options);
      } else {
        return this._options = options;
      }
    };

    Validator.matches = function(options) {
      var key, results, shouldReturn, value, _ref, _ref1;
      results = {};
      shouldReturn = false;
      for (key in options) {
        value = options[key];
        if (~((_ref = this._options) != null ? _ref.indexOf(key) : void 0)) {
          results[key] = value;
        }
        if (~((_ref1 = this._triggers) != null ? _ref1.indexOf(key) : void 0)) {
          results[key] = value;
          shouldReturn = true;
        }
      }
      if (shouldReturn) {
        return results;
      }
    };

    function Validator() {
      var mixins, options;
      options = arguments[0], mixins = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.options = options;
      Validator.__super__.constructor.apply(this, mixins);
    }

    Validator.prototype.validate = function(record) {
      return Batman.developer.error("You must override validate in Batman.Validator subclasses.");
    };

    Validator.prototype.format = function(key, messageKey, interpolations) {
      return Batman.t("errors.messages." + messageKey, interpolations);
    };

    Validator.prototype.handleBlank = function(value) {
      if (this.options.allowBlank && !Batman.PresenceValidator.prototype.isPresent(value)) {
        return true;
      }
    };

    return Validator;

  })(Batman.Object);

}).call(this);

(function() {

  Batman.Validators = [];

  Batman.extend(Batman.translate.messages, {
    errors: {
      format: "%{attribute} %{message}",
      messages: {
        too_short: "must be at least %{count} characters",
        too_long: "must be less than %{count} characters",
        wrong_length: "must be %{count} characters",
        blank: "can't be blank",
        not_numeric: "must be a number",
        greater_than: "must be greater than %{count}",
        greater_than_or_equal_to: "must be greater than or equal to %{count}",
        equal_to: "must be equal to %{count}",
        less_than: "must be less than %{count}",
        less_than_or_equal_to: "must be less than or equal to %{count}",
        not_matching: "is not valid",
        invalid_association: "is not valid"
      }
    }
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.RegExpValidator = (function(_super) {

    __extends(RegExpValidator, _super);

    RegExpValidator.triggers('regexp', 'pattern');

    RegExpValidator.options('allowBlank');

    function RegExpValidator(options) {
      var _ref;
      this.regexp = (_ref = options.regexp) != null ? _ref : options.pattern;
      RegExpValidator.__super__.constructor.apply(this, arguments);
    }

    RegExpValidator.prototype.validateEach = function(errors, record, key, callback) {
      var value;
      value = record.get(key);
      if (this.handleBlank(value)) {
        return callback();
      }
      if (!(value != null) || value === '' || !this.regexp.test(value)) {
        errors.add(key, this.format(key, 'not_matching'));
      }
      return callback();
    };

    return RegExpValidator;

  })(Batman.Validator);

  Batman.Validators.push(Batman.RegExpValidator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.PresenceValidator = (function(_super) {

    __extends(PresenceValidator, _super);

    function PresenceValidator() {
      return PresenceValidator.__super__.constructor.apply(this, arguments);
    }

    PresenceValidator.triggers('presence');

    PresenceValidator.prototype.validateEach = function(errors, record, key, callback) {
      var value;
      value = record.get(key);
      if (!this.isPresent(value)) {
        errors.add(key, this.format(key, 'blank'));
      }
      return callback();
    };

    PresenceValidator.prototype.isPresent = function(value) {
      return (value != null) && value !== '';
    };

    return PresenceValidator;

  })(Batman.Validator);

  Batman.Validators.push(Batman.PresenceValidator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.NumericValidator = (function(_super) {

    __extends(NumericValidator, _super);

    function NumericValidator() {
      return NumericValidator.__super__.constructor.apply(this, arguments);
    }

    NumericValidator.triggers('numeric', 'greaterThan', 'greaterThanOrEqualTo', 'equalTo', 'lessThan', 'lessThanOrEqualTo');

    NumericValidator.options('allowBlank');

    NumericValidator.prototype.validateEach = function(errors, record, key, callback) {
      var options, value;
      options = this.options;
      value = record.get(key);
      if (this.handleBlank(value)) {
        return callback();
      }
      if (!(value != null) || !(this.isNumeric(value) || this.canCoerceToNumeric(value))) {
        errors.add(key, this.format(key, 'not_numeric'));
      } else {
        if (options.greaterThan && value <= options.greaterThan) {
          errors.add(key, this.format(key, 'greater_than', {
            count: options.greaterThan
          }));
        }
        if (options.greaterThanOrEqualTo && value < options.greaterThanOrEqualTo) {
          errors.add(key, this.format(key, 'greater_than_or_equal_to', {
            count: options.greaterThanOrEqualTo
          }));
        }
        if (options.equalTo && value !== options.equalTo) {
          errors.add(key, this.format(key, 'equal_to', {
            count: options.equalTo
          }));
        }
        if (options.lessThan && value >= options.lessThan) {
          errors.add(key, this.format(key, 'less_than', {
            count: options.lessThan
          }));
        }
        if (options.lessThanOrEqualTo && value > options.lessThanOrEqualTo) {
          errors.add(key, this.format(key, 'less_than_or_equal_to', {
            count: options.lessThanOrEqualTo
          }));
        }
      }
      return callback();
    };

    NumericValidator.prototype.isNumeric = function(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    };

    NumericValidator.prototype.canCoerceToNumeric = function(value) {
      return (value - 0) == value && value.length > 0;
    };

    return NumericValidator;

  })(Batman.Validator);

  Batman.Validators.push(Batman.NumericValidator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.LengthValidator = (function(_super) {

    __extends(LengthValidator, _super);

    LengthValidator.triggers('minLength', 'maxLength', 'length', 'lengthWithin', 'lengthIn');

    LengthValidator.options('allowBlank');

    function LengthValidator(options) {
      var range;
      if (range = options.lengthIn || options.lengthWithin) {
        options.minLength = range[0];
        options.maxLength = range[1] || -1;
        delete options.lengthWithin;
        delete options.lengthIn;
      }
      LengthValidator.__super__.constructor.apply(this, arguments);
    }

    LengthValidator.prototype.validateEach = function(errors, record, key, callback) {
      var options, value;
      options = this.options;
      value = record.get(key);
      if (value !== '' && this.handleBlank(value)) {
        return callback();
      }
      if (value == null) {
        value = [];
      }
      if (options.minLength && value.length < options.minLength) {
        errors.add(key, this.format(key, 'too_short', {
          count: options.minLength
        }));
      }
      if (options.maxLength && value.length > options.maxLength) {
        errors.add(key, this.format(key, 'too_long', {
          count: options.maxLength
        }));
      }
      if (options.length && value.length !== options.length) {
        errors.add(key, this.format(key, 'wrong_length', {
          count: options.length
        }));
      }
      return callback();
    };

    return LengthValidator;

  })(Batman.Validator);

  Batman.Validators.push(Batman.LengthValidator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.AssociatedValidator = (function(_super) {

    __extends(AssociatedValidator, _super);

    function AssociatedValidator() {
      return AssociatedValidator.__super__.constructor.apply(this, arguments);
    }

    AssociatedValidator.triggers('associated');

    AssociatedValidator.prototype.validateEach = function(errors, record, key, callback) {
      var childFinished, count, value,
        _this = this;
      value = record.get(key);
      if (value != null) {
        if (value instanceof Batman.AssociationProxy) {
          value = typeof value.get === "function" ? value.get('target') : void 0;
        }
        count = 1;
        childFinished = function(err, childErrors) {
          if (childErrors.length > 0) {
            errors.add(key, _this.format(key, 'invalid_association'));
          }
          if (--count === 0) {
            return callback();
          }
        };
        if ((value != null ? value.forEach : void 0) != null) {
          value.forEach(function(record) {
            count += 1;
            return record.validate(childFinished);
          });
        } else if ((value != null ? value.validate : void 0) != null) {
          count += 1;
          value.validate(childFinished);
        }
        return childFinished(null, []);
      } else {
        return callback();
      }
    };

    return AssociatedValidator;

  })(Batman.Validator);

  Batman.Validators.push(Batman.AssociatedValidator);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ControllerActionFrame = (function(_super) {

    __extends(ControllerActionFrame, _super);

    ControllerActionFrame.prototype.operationOccurred = false;

    ControllerActionFrame.prototype.remainingOperations = 0;

    ControllerActionFrame.prototype.event('complete').oneShot = true;

    function ControllerActionFrame(options, onComplete) {
      ControllerActionFrame.__super__.constructor.call(this, options);
      this.once('complete', onComplete);
    }

    ControllerActionFrame.prototype.startOperation = function(options) {
      if (options == null) {
        options = {};
      }
      if (!options.internal) {
        this.operationOccurred = true;
      }
      this._changeOperationsCounter(1);
      return true;
    };

    ControllerActionFrame.prototype.finishOperation = function() {
      this._changeOperationsCounter(-1);
      return true;
    };

    ControllerActionFrame.prototype.startAndFinishOperation = function(options) {
      this.startOperation(options);
      this.finishOperation(options);
      return true;
    };

    ControllerActionFrame.prototype._changeOperationsCounter = function(delta) {
      var _ref;
      this.remainingOperations += delta;
      if (this.remainingOperations === 0) {
        this.fire('complete');
      }
      if ((_ref = this.parentFrame) != null) {
        _ref._changeOperationsCounter(delta);
      }
    };

    return ControllerActionFrame;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.DOM.InsertionBinding = (function(_super) {

    __extends(InsertionBinding, _super);

    InsertionBinding.prototype.isTwoWay = false;

    InsertionBinding.prototype.bindImmediately = false;

    InsertionBinding.prototype.onlyObserve = Batman.BindingDefinitionOnlyObserve.Data;

    function InsertionBinding(definition) {
      var _this = this;
      this.invert = definition.invert;
      this.placeholderNode = document.createComment("detached node " + (this.get('_batmanID')));
      InsertionBinding.__super__.constructor.apply(this, arguments);
      Batman.DOM.onParseExit(this.node, function() {
        _this.bind();
        if (_this.placeholderNode != null) {
          return Batman.DOM.trackBinding(_this, _this.placeholderNode);
        }
      });
    }

    InsertionBinding.prototype.dataChange = function(value) {
      var parentNode;
      parentNode = this.placeholderNode.parentNode || this.node.parentNode;
      if (!!value === !this.invert) {
        if (!(this.node.parentNode != null)) {
          Batman.DOM.insertBefore(parentNode, this.node, this.placeholderNode);
          return parentNode.removeChild(this.placeholderNode);
        }
      } else {
        if (this.node.parentNode != null) {
          parentNode.insertBefore(this.placeholderNode, this.node);
          return Batman.DOM.removeNode(this.node);
        }
      }
    };

    InsertionBinding.prototype.die = function() {
      var filteredValue, node, placeholderNode;
      if (this.dead) {
        return;
      }
      node = this.node, placeholderNode = this.placeholderNode;
      filteredValue = this.get('filteredValue');
      InsertionBinding.__super__.die.apply(this, arguments);
      if (!!filteredValue === !this.invert) {
        return Batman.DOM.destroyNode(placeholderNode);
      } else {
        return Batman.DOM.destroyNode(node);
      }
    };

    return InsertionBinding;

  })(Batman.DOM.AbstractBinding);

}).call(this);

(function() {
  var isEmptyDataObject;

  isEmptyDataObject = function(obj) {
    var name;
    for (name in obj) {
      return false;
    }
    return true;
  };

  Batman.extend(Batman, {
    cache: {},
    uuid: 0,
    expando: "batman" + Math.random().toString().replace(/\D/g, ''),
    canDeleteExpando: (function() {
      var div;
      try {
        div = document.createElement('div');
        return delete div.test;
      } catch (e) {
        return Batman.canDeleteExpando = false;
      }
    })(),
    noData: {
      "embed": true,
      "object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
      "applet": true
    },
    hasData: function(elem) {
      elem = (elem.nodeType ? Batman.cache[elem[Batman.expando]] : elem[Batman.expando]);
      return !!elem && !isEmptyDataObject(elem);
    },
    data: function(elem, name, data, pvt) {
      var cache, getByName, id, internalKey, ret, thisCache;
      if (!Batman.acceptData(elem)) {
        return;
      }
      internalKey = Batman.expando;
      getByName = typeof name === "string";
      cache = Batman.cache;
      id = elem[Batman.expando];
      if ((!id || (pvt && id && (cache[id] && !cache[id][internalKey]))) && getByName && data === void 0) {
        return;
      }
      if (!id) {
        if (elem.nodeType !== 3) {
          elem[Batman.expando] = id = ++Batman.uuid;
        } else {
          id = Batman.expando;
        }
      }
      if (!cache[id]) {
        cache[id] = {};
      }
      if (typeof name === "object" || typeof name === "function") {
        if (pvt) {
          cache[id][internalKey] = Batman.extend(cache[id][internalKey], name);
        } else {
          cache[id] = Batman.extend(cache[id], name);
        }
      }
      thisCache = cache[id];
      if (pvt) {
        thisCache[internalKey] || (thisCache[internalKey] = {});
        thisCache = thisCache[internalKey];
      }
      if (data !== void 0) {
        thisCache[name] = data;
      }
      if (getByName) {
        ret = thisCache[name];
      } else {
        ret = thisCache;
      }
      return ret;
    },
    removeData: function(elem, name, pvt) {
      var cache, id, internalCache, internalKey, isNode, thisCache;
      if (!Batman.acceptData(elem)) {
        return;
      }
      internalKey = Batman.expando;
      isNode = elem.nodeType;
      cache = Batman.cache;
      id = elem[Batman.expando];
      if (!cache[id]) {
        return;
      }
      if (name) {
        thisCache = pvt ? cache[id][internalKey] : cache[id];
        if (thisCache) {
          delete thisCache[name];
          if (!isEmptyDataObject(thisCache)) {
            return;
          }
        }
      }
      if (pvt) {
        delete cache[id][internalKey];
        if (!isEmptyDataObject(cache[id])) {
          return;
        }
      }
      internalCache = cache[id][internalKey];
      if (Batman.canDeleteExpando || !cache.setInterval) {
        delete cache[id];
      } else {
        cache[id] = null;
      }
      if (internalCache) {
        cache[id] = {};
        return cache[id][internalKey] = internalCache;
      } else {
        if (Batman.canDeleteExpando) {
          return delete elem[Batman.expando];
        } else if (elem.removeAttribute) {
          return elem.removeAttribute(Batman.expando);
        } else {
          return elem[Batman.expando] = null;
        }
      }
    },
    _data: function(elem, name, data) {
      return Batman.data(elem, name, data, true);
    },
    acceptData: function(elem) {
      var match;
      if (elem.nodeName) {
        match = Batman.noData[elem.nodeName.toLowerCase()];
        if (match) {
          return !(match === true || elem.getAttribute("classid") !== match);
        }
      }
      return true;
    }
  });

}).call(this);

(function() {
  var buntUndefined, defaultAndOr,
    __slice = [].slice;

  buntUndefined = function(f) {
    return function(value) {
      if (value == null) {
        return void 0;
      } else {
        return f.apply(this, arguments);
      }
    };
  };

  defaultAndOr = function(lhs, rhs) {
    return lhs || rhs;
  };

  Batman.Filters = {
    raw: buntUndefined(function(value, binding) {
      binding.escapeValue = false;
      return value;
    }),
    get: buntUndefined(function(value, key) {
      if (value.get != null) {
        return value.get(key);
      } else {
        return value[key];
      }
    }),
    equals: buntUndefined(function(lhs, rhs, binding) {
      return lhs === rhs;
    }),
    and: function(lhs, rhs) {
      return lhs && rhs;
    },
    or: function(lhs, rhs, binding) {
      return lhs || rhs;
    },
    not: function(value, binding) {
      return !value;
    },
    trim: buntUndefined(function(value, binding) {
      return value.trim();
    }),
    matches: buntUndefined(function(value, searchFor) {
      return value.indexOf(searchFor) !== -1;
    }),
    truncate: buntUndefined(function(value, length, end, binding) {
      if (end == null) {
        end = "...";
      }
      if (!binding) {
        binding = end;
        end = "...";
      }
      if (value.length > length) {
        value = value.substr(0, length - end.length) + end;
      }
      return value;
    }),
    "default": function(value, defaultValue, binding) {
      if ((value != null) && value !== '') {
        return value;
      } else {
        return defaultValue;
      }
    },
    prepend: function(value, string, binding) {
      return (string != null ? string : '') + (value != null ? value : '');
    },
    append: function(value, string, binding) {
      return (value != null ? value : '') + (string != null ? string : '');
    },
    replace: buntUndefined(function(value, searchFor, replaceWith, flags, binding) {
      if (!binding) {
        binding = flags;
        flags = void 0;
      }
      if (flags === void 0) {
        return value.replace(searchFor, replaceWith);
      } else {
        return value.replace(searchFor, replaceWith, flags);
      }
    }),
    downcase: buntUndefined(function(value) {
      return value.toLowerCase();
    }),
    upcase: buntUndefined(function(value) {
      return value.toUpperCase();
    }),
    pluralize: buntUndefined(function(string, count, includeCount, binding) {
      if (!binding) {
        binding = includeCount;
        includeCount = true;
        if (!binding) {
          binding = count;
          count = void 0;
        }
      }
      if (count != null) {
        return Batman.helpers.pluralize(count, string, void 0, includeCount);
      } else {
        return Batman.helpers.pluralize(string);
      }
    }),
    humanize: buntUndefined(function(string, binding) {
      return Batman.helpers.humanize(string);
    }),
    join: buntUndefined(function(value, withWhat, binding) {
      if (withWhat == null) {
        withWhat = '';
      }
      if (!binding) {
        binding = withWhat;
        withWhat = '';
      }
      return value.join(withWhat);
    }),
    sort: buntUndefined(function(value) {
      return value.sort();
    }),
    map: buntUndefined(function(value, key) {
      return value.map(function(x) {
        return Batman.get(x, key);
      });
    }),
    has: function(set, item) {
      if (set == null) {
        return false;
      }
      return Batman.contains(set, item);
    },
    first: buntUndefined(function(value) {
      return value[0];
    }),
    meta: buntUndefined(function(value, keypath) {
      Batman.developer.assert(value.meta, "Error, value doesn't have a meta to filter on!");
      return value.meta.get(keypath);
    }),
    interpolate: function(string, interpolationKeypaths, binding) {
      var k, v, values;
      if (!binding) {
        binding = interpolationKeypaths;
        interpolationKeypaths = void 0;
      }
      if (!string) {
        return;
      }
      values = {};
      for (k in interpolationKeypaths) {
        v = interpolationKeypaths[k];
        values[k] = this.get(v);
        if (!(values[k] != null)) {
          Batman.developer.warn("Warning! Undefined interpolation key " + k + " for interpolation", string);
          values[k] = '';
        }
      }
      return Batman.helpers.interpolate(string, values);
    },
    withArguments: function() {
      var binding, block, curryArgs, _i;
      block = arguments[0], curryArgs = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), binding = arguments[_i++];
      if (!block) {
        return;
      }
      return function() {
        var regularArgs;
        regularArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return block.call.apply(block, [this].concat(__slice.call(curryArgs), __slice.call(regularArgs)));
      };
    },
    routeToAction: buntUndefined(function(model, action) {
      var params;
      params = Batman.Dispatcher.paramsFromArgument(model);
      params.action = action;
      return params;
    }),
    escape: buntUndefined(Batman.escapeHTML)
  };

  (function() {
    var k, _i, _len, _ref, _results;
    _ref = ['capitalize', 'singularize', 'underscore', 'camelize'];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _results.push(Batman.Filters[k] = buntUndefined(Batman.helpers[k]));
    }
    return _results;
  })();

  Batman.developer.addFilters();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.RenderContext = (function() {
    var ContextProxy;

    RenderContext.deProxy = function(object) {
      if ((object != null) && object.isContextProxy) {
        return object.get('proxiedObject');
      } else {
        return object;
      }
    };

    RenderContext.root = function() {
      var root;
      if (Batman.currentApp != null) {
        root = Batman.currentApp.get('_renderContext');
      }
      return root != null ? root : root = this.base;
    };

    RenderContext.prototype.windowWrapper = {
      window: Batman.container
    };

    function RenderContext(object, parent) {
      this.object = object;
      this.parent = parent;
    }

    RenderContext.prototype.findKey = function(key) {
      var base, currentNode, val;
      base = key.split('.')[0].split('|')[0].trim();
      currentNode = this;
      while (currentNode) {
        val = Batman.get(currentNode.object, base);
        if (typeof val !== 'undefined') {
          val = Batman.get(currentNode.object, key);
          return [val, currentNode.object].map(this.constructor.deProxy);
        }
        currentNode = currentNode.parent;
      }
      return [Batman.get(this.windowWrapper, key), this.windowWrapper];
    };

    RenderContext.prototype.get = function(key) {
      return this.findKey(key)[0];
    };

    RenderContext.prototype.contextForKey = function(key) {
      return this.findKey(key)[1];
    };

    RenderContext.prototype.descend = function(object, scopedKey) {
      var oldObject;
      if (scopedKey) {
        oldObject = object;
        object = new Batman.Object();
        object[scopedKey] = oldObject;
      }
      return new this.constructor(object, this);
    };

    RenderContext.prototype.descendWithDefinition = function(definition) {
      var proxy;
      proxy = new ContextProxy(definition);
      return this.descend(proxy, definition.attr);
    };

    RenderContext.prototype.chain = function() {
      var parent, x;
      x = [];
      parent = this;
      while (parent) {
        x.push(parent.object);
        parent = parent.parent;
      }
      return x;
    };

    RenderContext.ContextProxy = ContextProxy = (function(_super) {

      __extends(ContextProxy, _super);

      ContextProxy.prototype.isContextProxy = true;

      ContextProxy.accessor('proxiedObject', function() {
        return this.binding.get('filteredValue');
      });

      ContextProxy.accessor({
        get: function(key) {
          return this.get("proxiedObject." + key);
        },
        set: function(key, value) {
          return this.set("proxiedObject." + key, value);
        },
        unset: function(key) {
          return this.unset("proxiedObject." + key);
        }
      });

      function ContextProxy(definition) {
        this.binding = new Batman.DOM.AbstractBinding(definition);
      }

      return ContextProxy;

    })(Batman.Object);

    return RenderContext;

  }).call(this);

  Batman.RenderContext.base = new Batman.RenderContext(Batman.RenderContext.prototype.windowWrapper);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Batman.ViewStore = (function(_super) {

    __extends(ViewStore, _super);

    function ViewStore() {
      ViewStore.__super__.constructor.apply(this, arguments);
      this._viewContents = {};
      this._requestedPaths = new Batman.SimpleSet;
    }

    ViewStore.prototype.propertyClass = Batman.Property;

    ViewStore.prototype.fetchView = function(path) {
      var _this = this;
      return new Batman.Request({
        url: Batman.Navigator.normalizePath(Batman.config.viewPrefix, "" + path + ".html"),
        type: 'html',
        success: function(response) {
          return _this.set(path, response);
        },
        error: function(response) {
          throw new Error("Could not load view from " + path);
        }
      });
    };

    ViewStore.accessor({
      'final': true,
      get: function(path) {
        var contents;
        if (path.charAt(0) !== '/') {
          return this.get("/" + path);
        }
        if (this._viewContents[path]) {
          return this._viewContents[path];
        }
        if (this._requestedPaths.has(path)) {
          return;
        }
        if (contents = this._sourceFromDOM(path)) {
          return contents;
        }
        if (Batman.config.fetchRemoteViews) {
          this.fetchView(path);
        } else {
          throw new Error("Couldn't find view source for \'" + path + "\'!");
        }
      },
      set: function(path, content) {
        if (path.charAt(0) !== '/') {
          return this.set("/" + path, content);
        }
        this._requestedPaths.add(path);
        return this._viewContents[path] = content;
      }
    });

    ViewStore.prototype.prefetch = function(path) {
      this.get(path);
      return true;
    };

    ViewStore.prototype._sourceFromDOM = function(path) {
      var node, relativePath;
      relativePath = path.slice(1);
      if (node = Batman.DOM.querySelector(document, "[data-defineview*='" + relativePath + "']")) {
        Batman.setImmediate(function() {
          var _ref;
          return (_ref = node.parentNode) != null ? _ref.removeChild(node) : void 0;
        });
        return Batman.DOM.defineView(path, node);
      }
    };

    return ViewStore;

  })(Batman.Object);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.View = (function(_super) {

    __extends(View, _super);

    View.YieldStorage = (function(_super1) {

      __extends(YieldStorage, _super1);

      function YieldStorage() {
        return YieldStorage.__super__.constructor.apply(this, arguments);
      }

      YieldStorage.wrapAccessor(function(core) {
        return {
          get: function(key) {
            var val;
            val = core.get.call(this, key);
            if (!(val != null)) {
              val = this.set(key, []);
            }
            return val;
          }
        };
      });

      return YieldStorage;

    })(Batman.Hash);

    View.store = new Batman.ViewStore();

    View.option = function() {
      var keys;
      keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.accessor.apply(this, __slice.call(keys).concat([{
        get: function(key) {
          var _ref;
          return (_ref = this.get("argumentBindings." + key)) != null ? _ref.get('filteredValue') : void 0;
        },
        set: function(key, value) {
          var _ref;
          return (_ref = this.get("argumentBindings." + key)) != null ? _ref.set('filteredValue', value) : void 0;
        },
        unset: function(key) {
          var _ref;
          return (_ref = this.get("argumentBindings." + key)) != null ? _ref.unset('filteredValue') : void 0;
        }
      }]));
    };

    View.prototype.isView = true;

    View.prototype.cache = true;

    View.prototype._rendered = false;

    View.prototype.node = null;

    View.prototype.event('ready').oneShot = true;

    View.accessor('argumentBindings', function() {
      var _this = this;
      return new Batman.TerminalAccessible(function(key) {
        var bindingKey, context, definition, keyPath, node, _ref;
        if (!((node = _this.get('node')) && (context = _this.get('context')))) {
          return;
        }
        keyPath = node.getAttribute(("data-view-" + key).toLowerCase());
        if (keyPath == null) {
          return;
        }
        bindingKey = "_argumentBinding" + key;
        if ((_ref = _this[bindingKey]) != null) {
          _ref.die();
        }
        definition = new Batman.DOM.ReaderBindingDefinition(node, keyPath, context);
        return _this[bindingKey] = new Batman.DOM.ViewArgumentBinding(definition);
      });
    });

    View.accessor('html', {
      get: function() {
        var source;
        if (this.html && this.html.length > 0) {
          return this.html;
        }
        if (!(source = this.get('source'))) {
          return;
        }
        source = Batman.Navigator.normalizePath(source);
        return this.html = this.constructor.store.get(source);
      },
      set: function(_, html) {
        return this.html = html;
      }
    });

    View.accessor('node', {
      get: function() {
        var html;
        if (this.node == null) {
          html = this.get('html');
          if (!(html && html.length > 0)) {
            return;
          }
          this.node = document.createElement('div');
          this._setNodeOwner(this.node);
          Batman.DOM.setInnerHTML(this.node, html);
        }
        return this.node;
      },
      set: function(_, node) {
        var updateHTML,
          _this = this;
        this.node = node;
        this._setNodeOwner(node);
        updateHTML = function(html) {
          if (html != null) {
            Batman.DOM.setInnerHTML(_this.node, html);
            return _this.forget('html', updateHTML);
          }
        };
        this.observeAndFire('html', updateHTML);
        return node;
      }
    });

    View.accessor('yields', function() {
      return new this.constructor.YieldStorage;
    });

    View.accessor('fetched?', function() {
      return this.get('source') != null;
    });

    View.accessor('readyToRender', function() {
      var _ref;
      return this.get('node') && (this.get('fetched?') ? ((_ref = this.get('html')) != null ? _ref.length : void 0) > 0 : true);
    });

    function View(options) {
      var context,
        _this = this;
      if (options == null) {
        options = {};
      }
      context = options.context;
      if (context) {
        if (!(context instanceof Batman.RenderContext)) {
          context = Batman.RenderContext.root().descend(context);
        }
      } else {
        context = Batman.RenderContext.root();
      }
      options.context = context.descend(this);
      View.__super__.constructor.call(this, options);
      Batman.Property.withoutTracking(function() {
        return _this.observeAndFire('readyToRender', function(ready) {
          if (ready) {
            return _this.render();
          }
        });
      });
    }

    View.prototype.render = function() {
      var node,
        _this = this;
      if (this._rendered) {
        return;
      }
      this._rendered = true;
      this._renderer = new Batman.Renderer(node = this.get('node'), this.get('context'), this);
      return this._renderer.once('rendered', function() {
        return _this.fire('ready', node);
      });
    };

    View.prototype.isInDOM = function() {
      var node;
      if ((node = this.get('node'))) {
        return (node.parentNode != null) || this.get('yields').some(function(name, nodes) {
          var _i, _len;
          for (_i = 0, _len = nodes.length; _i < _len; _i++) {
            node = nodes[_i].node;
            if (node.parentNode != null) {
              return true;
            }
          }
          return false;
        });
      } else {
        return false;
      }
    };

    View.prototype.die = function() {
      var _ref;
      this.fire('destroy', this.node);
      this.forget();
      if ((_ref = this._batman.properties) != null) {
        _ref.forEach(function(key, property) {
          return property.die();
        });
      }
      return this.get('yields').forEach(function(name, actions) {
        var node, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = actions.length; _i < _len; _i++) {
          node = actions[_i].node;
          _results.push(Batman.DOM.didDestroyNode(node));
        }
        return _results;
      });
    };

    View.prototype.applyYields = function() {
      return this.get('yields').forEach(function(name, nodes) {
        var action, node, yieldObject, _i, _len, _ref, _results;
        yieldObject = Batman.DOM.Yield.withName(name);
        _results = [];
        for (_i = 0, _len = nodes.length; _i < _len; _i++) {
          _ref = nodes[_i], node = _ref.node, action = _ref.action;
          _results.push(yieldObject[action](node));
        }
        return _results;
      });
    };

    View.prototype.retractYields = function() {
      return this.get('yields').forEach(function(name, nodes) {
        var node, _i, _len, _ref, _results;
        _results = [];
        for (_i = 0, _len = nodes.length; _i < _len; _i++) {
          node = nodes[_i].node;
          _results.push((_ref = node.parentNode) != null ? _ref.removeChild(node) : void 0);
        }
        return _results;
      });
    };

    View.prototype.pushYieldAction = function(key, action, node) {
      this._setNodeYielder(node);
      return this.get("yields").get(key).push({
        node: node,
        action: action
      });
    };

    View.prototype._setNodeOwner = function(node) {
      return Batman._data(node, 'view', this);
    };

    View.prototype._setNodeYielder = function(node) {
      return Batman._data(node, 'yielder', this);
    };

    View.prototype.on('ready', function() {
      return typeof this.ready === "function" ? this.ready.apply(this, arguments) : void 0;
    });

    View.prototype.on('appear', function() {
      return typeof this.viewDidAppear === "function" ? this.viewDidAppear.apply(this, arguments) : void 0;
    });

    View.prototype.on('disappear', function() {
      return typeof this.viewDidDisappear === "function" ? this.viewDidDisappear.apply(this, arguments) : void 0;
    });

    View.prototype.on('beforeAppear', function() {
      return typeof this.viewWillAppear === "function" ? this.viewWillAppear.apply(this, arguments) : void 0;
    });

    View.prototype.on('beforeDisappear', function() {
      return typeof this.viewWillDisappear === "function" ? this.viewWillDisappear.apply(this, arguments) : void 0;
    });

    return View;

  }).call(this, Batman.Object);

}).call(this);

(function() {
  var Yield,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Batman.DOM.Yield = Yield = (function(_super) {

    __extends(Yield, _super);

    Yield.yields = {};

    Yield.queued = function(fn) {
      return function() {
        var args, handler,
          _this = this;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (this.containerNode != null) {
          return fn.apply(this, args);
        } else {
          return handler = this.observe('containerNode', function() {
            var result;
            result = fn.apply(_this, args);
            _this.forget('containerNode', handler);
            return result;
          });
        }
      };
    };

    Yield.reset = function() {
      return this.yields = {};
    };

    Yield.withName = function(name) {
      var _base;
      (_base = this.yields)[name] || (_base[name] = new this({
        name: name
      }));
      return this.yields[name];
    };

    Yield.forEach = function(f) {
      var name, yieldObject, _ref;
      _ref = this.yields;
      for (name in _ref) {
        yieldObject = _ref[name];
        f(yieldObject);
      }
    };

    Yield.clearAll = function() {
      return this.forEach(function(yieldObject) {
        return yieldObject.clear();
      });
    };

    Yield.cycleAll = function() {
      return this.forEach(function(yieldObject) {
        return yieldObject.cycle();
      });
    };

    Yield.clearAllStale = function() {
      return this.forEach(function(yieldObject) {
        return yieldObject.clearStale();
      });
    };

    function Yield() {
      this.cycle();
    }

    Yield.prototype.cycle = function() {
      return this.currentVersionNodes = [];
    };

    Yield.prototype.clear = Yield.queued(function() {
      var child, _i, _len, _ref, _results;
      this.cycle();
      _ref = (function() {
        var _j, _len, _ref, _results1;
        _ref = this.containerNode.childNodes;
        _results1 = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          child = _ref[_j];
          _results1.push(child);
        }
        return _results1;
      }).call(this);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(Batman.DOM.removeOrDestroyNode(child));
      }
      return _results;
    });

    Yield.prototype.clearStale = Yield.queued(function() {
      var child, _i, _len, _ref, _results;
      _ref = (function() {
        var _j, _len, _ref, _results1;
        _ref = this.containerNode.childNodes;
        _results1 = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          child = _ref[_j];
          _results1.push(child);
        }
        return _results1;
      }).call(this);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (!~this.currentVersionNodes.indexOf(child)) {
          _results.push(Batman.DOM.removeOrDestroyNode(child));
        }
      }
      return _results;
    });

    Yield.prototype.append = Yield.queued(function(node) {
      this.currentVersionNodes.push(node);
      return Batman.DOM.appendChild(this.containerNode, node, true);
    });

    Yield.prototype.replace = Yield.queued(function(node) {
      this.clear();
      return this.append(node);
    });

    return Yield;

  })(Batman.Object);

}).call(this);

(function() {



}).call(this);

(function() {

  Batman.extend(Batman.DOM, {
    querySelectorAll: function(node, selector) {
      return jQuery(selector, node);
    },
    querySelector: function(node, selector) {
      return jQuery(selector, node)[0];
    },
    setInnerHTML: function(node, html) {
      var child, childNodes, result, _i, _j, _len, _len1;
      childNodes = (function() {
        var _i, _len, _ref, _results;
        _ref = node.childNodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          _results.push(child);
        }
        return _results;
      })();
      for (_i = 0, _len = childNodes.length; _i < _len; _i++) {
        child = childNodes[_i];
        Batman.DOM.willRemoveNode(child);
      }
      result = jQuery(node).html(html);
      for (_j = 0, _len1 = childNodes.length; _j < _len1; _j++) {
        child = childNodes[_j];
        Batman.DOM.didRemoveNode(child);
      }
      return result;
    },
    removeNode: function(node) {
      var _ref;
      Batman.DOM.willRemoveNode(node);
      if ((_ref = node.parentNode) != null) {
        _ref.removeChild(node);
      }
      return Batman.DOM.didRemoveNode(node);
    },
    destroyNode: function(node) {
      Batman.DOM.willDestroyNode(node);
      Batman.DOM.willRemoveNode(node);
      jQuery(node).remove();
      Batman.DOM.didRemoveNode(node);
      return Batman.DOM.didDestroyNode(node);
    },
    appendChild: function(parent, child) {
      Batman.DOM.willInsertNode(child);
      jQuery(parent).append(child);
      return Batman.DOM.didInsertNode(child);
    }
  });

  Batman.Request.prototype._parseResponseHeaders = function(xhr) {
    var headers;
    return headers = xhr.getAllResponseHeaders().split('\n').reduce(function(acc, header) {
      var key, matches, value;
      if (matches = header.match(/([^:]*):\s*(.*)/)) {
        key = matches[1];
        value = matches[2];
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  Batman.Request.prototype._prepareOptions = function(data) {
    var options, _ref,
      _this = this;
    options = {
      url: this.get('url'),
      type: this.get('method'),
      dataType: this.get('type'),
      data: data || this.get('data'),
      username: this.get('username'),
      password: this.get('password'),
      headers: this.get('headers'),
      beforeSend: function() {
        return _this.fire('loading');
      },
      success: function(response, textStatus, xhr) {
        _this.mixin({
          xhr: xhr,
          status: xhr.status,
          response: response,
          responseHeaders: _this._parseResponseHeaders(xhr)
        });
        return _this.fire('success', response);
      },
      error: function(xhr, status, error) {
        _this.mixin({
          xhr: xhr,
          status: xhr.status,
          response: xhr.responseText,
          responseHeaders: _this._parseResponseHeaders(xhr)
        });
        xhr.request = _this;
        return _this.fire('error', xhr);
      },
      complete: function() {
        return _this.fire('loaded');
      }
    };
    if ((_ref = this.get('method')) === 'PUT' || _ref === 'POST') {
      if (!this.hasFileUploads()) {
        options.contentType = this.get('contentType');
        if (typeof options.data === 'object') {
          options.processData = false;
          options.data = Batman.URI.queryFromParams(options.data);
        }
      } else {
        options.contentType = false;
        options.processData = false;
        options.data = this.constructor.objectToFormData(options.data);
      }
    }
    return options;
  };

  Batman.Request.prototype.send = function(data) {
    return jQuery.ajax(this._prepareOptions(data));
  };

  Batman.mixins.animation = {
    show: function(addToParent) {
      var jq, show, _ref, _ref1;
      jq = $(this);
      show = function() {
        return jq.show(600);
      };
      if (addToParent) {
        if ((_ref = addToParent.append) != null) {
          _ref.appendChild(this);
        }
        if ((_ref1 = addToParent.before) != null) {
          _ref1.parentNode.insertBefore(this, addToParent.before);
        }
        jq.hide();
        setTimeout(show, 0);
      } else {
        show();
      }
      return this;
    },
    hide: function(removeFromParent) {
      var _this = this;
      $(this).hide(600, function() {
        var _ref;
        if (removeFromParent) {
          if ((_ref = _this.parentNode) != null) {
            _ref.removeChild(_this);
          }
        }
        return Batman.DOM.didRemoveNode(_this);
      });
      return this;
    }
  };

}).call(this);

(function() {
  var lastEvents, source, widgets,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Batman.Filters.prettyNumber = function(num) {
    if (!isNaN(num)) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  };

  Batman.Filters.dashize = function(str) {
    var dashes_rx1, dashes_rx2;
    dashes_rx1 = /([A-Z]+)([A-Z][a-z])/g;
    dashes_rx2 = /([a-z\d])([A-Z])/g;
    return str.replace(dashes_rx1, '$1_$2').replace(dashes_rx2, '$1_$2').replace(/_/g, '-').toLowerCase();
  };

  Batman.Filters.shortenedNumber = function(num) {
    if (isNaN(num)) {
      return num;
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num;
    }
  };

  window.Dashing = (function(_super) {

    __extends(Dashing, _super);

    function Dashing() {
      return Dashing.__super__.constructor.apply(this, arguments);
    }

    Dashing.on('reload', function(data) {
      return window.location.reload(true);
    });

    Dashing.root(function() {});

    return Dashing;

  })(Batman.App);

  Dashing.params = Batman.URI.paramsFromQuery(window.location.search.slice(1));

  Dashing.Widget = (function(_super) {

    __extends(Widget, _super);

    function Widget() {
      this.onData = __bind(this.onData, this);

      this.receiveData = __bind(this.receiveData, this);

      var type, _base, _name;
      this.constructor.prototype.source = Batman.Filters.underscore(this.constructor.name);
      Widget.__super__.constructor.apply(this, arguments);
      this.mixin($(this.node).data());
      (_base = Dashing.widgets)[_name = this.id] || (_base[_name] = []);
      Dashing.widgets[this.id].push(this);
      this.mixin(Dashing.lastEvents[this.id]);
      type = Batman.Filters.dashize(this.view);
      $(this.node).addClass("widget widget-" + type + " " + this.id);
    }

    Widget.accessor('updatedAtMessage', function() {
      var hours, minutes, timestamp, updatedAt;
      if (updatedAt = this.get('updatedAt')) {
        timestamp = new Date(updatedAt * 1000);
        hours = timestamp.getHours();
        minutes = ("0" + timestamp.getMinutes()).slice(-2);
        return "Last updated at " + hours + ":" + minutes;
      }
    });

    Widget.prototype.on('ready', function() {
      return Dashing.Widget.fire('ready');
    });

    Widget.prototype.receiveData = function(data) {
      this.mixin(data);
      return this.onData(data);
    };

    Widget.prototype.onData = function(data) {};

    return Widget;

  })(Batman.View);

  Dashing.AnimatedValue = {
    get: Batman.Property.defaultAccessor.get,
    set: function(k, to) {
      var num, num_interval, timer, up,
        _this = this;
      if (!(to != null) || isNaN(to)) {
        return this[k] = to;
      } else {
        timer = "interval_" + k;
        num = !isNaN(this[k]) && (this[k] != null) ? this[k] : 0;
        if (!(this[timer] || num === to)) {
          to = parseFloat(to);
          num = parseFloat(num);
          up = to > num;
          num_interval = Math.abs(num - to) / 90;
          this[timer] = setInterval(function() {
            num = up ? Math.ceil(num + num_interval) : Math.floor(num - num_interval);
            if ((up && num > to) || (!up && num < to)) {
              num = to;
              clearInterval(_this[timer]);
              _this[timer] = null;
              delete _this[timer];
            }
            _this[k] = num;
            return _this.set(k, to);
          }, 10);
        }
        return this[k] = num;
      }
    }
  };

  Dashing.widgets = widgets = {};

  Dashing.lastEvents = lastEvents = {};

  Dashing.debugMode = false;

  source = new EventSource('events');

  source.addEventListener('open', function(e) {
    return console.log("Connection opened", e);
  });

  source.addEventListener('error', function(e) {
    console.log("Connection error", e);
    if (e.currentTarget.readyState === EventSource.CLOSED) {
      console.log("Connection closed");
      return setTimeout((function() {
        return window.location.reload();
      }), 5 * 60 * 1000);
    }
  });

  source.addEventListener('message', function(e) {
    var data, widget, _i, _len, _ref, _ref1, _ref2, _results;
    data = JSON.parse(e.data);
    if (((_ref = lastEvents[data.id]) != null ? _ref.updatedAt : void 0) !== data.updatedAt) {
      if (Dashing.debugMode) {
        console.log("Received data for " + data.id, data);
      }
      lastEvents[data.id] = data;
      if (((_ref1 = widgets[data.id]) != null ? _ref1.length : void 0) > 0) {
        _ref2 = widgets[data.id];
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          widget = _ref2[_i];
          _results.push(widget.receiveData(data));
        }
        return _results;
      }
    }
  });

  source.addEventListener('dashboards', function(e) {
    var data;
    data = JSON.parse(e.data);
    if (Dashing.debugMode) {
      console.log("Received data for dashboards", data);
    }
    if (data.dashboard === '*' || window.location.pathname === ("/" + data.dashboard)) {
      return Dashing.fire(data.event, data);
    }
  });

  $(document).ready(function() {
    return Dashing.run();
  });

}).call(this);

!function() {
  var d3 = {
    version: "3.4.13"
  };
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = document, d3_documentElement = d3_document.documentElement, d3_window = window;
  try {
    d3_array(d3_documentElement.childNodes)[0].nodeType;
  } catch (e) {
    d3_array = function(list) {
      var i = list.length, array = new Array(i);
      while (i--) array[i] = list[i];
      return array;
    };
  }
  try {
    d3_document.createElement("div").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_element_prototype = d3_window.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
    d3_element_prototype.setAttribute = function(name, value) {
      d3_element_setAttribute.call(this, name, value + "");
    };
    d3_element_prototype.setAttributeNS = function(space, local, value) {
      d3_element_setAttributeNS.call(this, space, local, value + "");
    };
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  function d3_number(x) {
    return x === null ? NaN : +x;
  }
  function d3_numeric(x) {
    return !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) s += a; else --j;
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) s += a; else --j;
    }
    return j ? s / j : undefined;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    var numbers = [], n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) numbers.push(a);
    }
    return numbers.length ? d3.quantile(numbers.sort(d3_ascending), .5) : undefined;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m], array[m] = array[i], array[i] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  }
  d3.map = function(object) {
    var map = new d3_Map();
    if (object instanceof d3_Map) object.forEach(function(key, value) {
      map.set(key, value);
    }); else for (var key in object) map.set(key, object[key]);
    return map;
  };
  function d3_Map() {
    this._ = Object.create(null);
  }
  var d3_map_proto = "__proto__", d3_map_zero = "\x00";
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this._[d3_map_escape(key)];
    },
    set: function(key, value) {
      return this._[d3_map_escape(key)] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      for (var key in this._) values.push(this._[key]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var key in this._) entries.push({
        key: d3_map_unescape(key),
        value: this._[key]
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
    }
  });
  function d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  function d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }
  function d3_map_has(key) {
    return d3_map_escape(key) in this._;
  }
  function d3_map_remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  function d3_map_keys() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this._) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this._) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {
    this._ = Object.create(null);
  }
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(key) {
      this._[d3_map_escape(key += "")] = true;
      return key;
    },
    remove: d3_map_remove,
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key));
    }
  });
  d3.behavior = {};
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.slice(i + 1);
      type = type.slice(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatcher = d3_documentElement.matches || d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")], d3_selectMatches = function(n, s) {
    return d3_selectMatcher.call(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3_selectionRoot;
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) {
        prefix = name.slice(0, i);
        name = name.slice(i + 1);
      }
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return (name + "").trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? function() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    } : function() {
      return this.ownerDocument.createElementNS(this.namespaceURI, name);
    };
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(function() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    });
  };
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), keyValues = new Array(n), keyValue;
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.has(keyValue = key.call(node = group[i], node.__data__, i))) {
            exitNodes[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues[i] = keyValue;
        }
        for (i = -1; ++i < m; ) {
          if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          } else if (node !== true) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          }
          nodeByKeyValue.set(keyValue, true);
        }
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.get(keyValues[i]) !== true) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    d3_selection_each(this, function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3_selectionPrototype.transition = function() {
    var id = d3_transitionInheritId || ++d3_transitionId, subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_selectionPrototype.interrupt = function() {
    return this.each(d3_selection_interrupt);
  };
  function d3_selection_interrupt() {
    var lock = this.__transition__;
    if (lock) ++lock.active;
  }
  d3.select = function(node) {
    var group = [ typeof node === "string" ? d3_select(node, d3_document) : node ];
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  var d3_selectionRoot = d3.select(d3_documentElement);
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.slice(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  d3_selection_onFilters.forEach(function(k) {
    if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
  });
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect = "onselectstart" in d3_document ? null : d3_vendorSymbol(d3_documentElement.style, "userSelect"), d3_event_dragId = 0;
  function d3_event_dragSuppress() {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect) {
      var style = d3_documentElement.style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        function off() {
          w.on(click, null);
        }
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {
        svg = d3.select("body").append("svg").style({
          position: "absolute",
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          border: "none"
        }, "important");
        var ctm = svg[0][0].getScreenCTM();
        d3_mouse_bug44083 = !(ctm.f || ctm.e);
        svg.remove();
      }
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, 
      point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_behavior_dragMouseSubject, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_behavior_dragTouchSubject, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject()).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged && d3.event.target === target);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  function d3_behavior_dragTouchSubject() {
    return d3.event.target;
  }
  function d3_behavior_dragMouseSubject() {
    return d3_window;
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];
    var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), dr = r1 - r0, S = (dr || Math.log(w1 / w0)) / ρ;
    function interpolate(t) {
      var s = t * S;
      if (dr) {
        var coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      }
      return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * s) ];
    }
    interpolate.duration = S * 1e3;
    return interpolate;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = dx / 2, cy = dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: +_
      };
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      dispatch({
        type: "zoomend"
      });
    }
    function mousedowned() {
      var that = this, target = d3.event.target, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, null).on(mouseup, null);
        dragRestore(dragged && d3.event.target === target);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, targets = [], subject = d3.select(that), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      started();
      zoomstarted(dispatch);
      subject.on(mousedown, null).on(touchstart, started);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var target = d3.event.target;
        d3.select(target).on(touchmove, moved).on(touchend, ended);
        targets.push(target);
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0], l = locations0[p.identifier];
            scaleTo(view.k * 2);
            translateTo(p, l);
            d3_eventPreventDefault();
            zoomed(dispatch);
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        d3.selectAll(targets).on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else translate0 = location(center0 = center || d3.mouse(this)), 
      d3_selection_interrupt.call(this), zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(center0, translate0);
      zoomed(dispatch);
    }
    function dblclicked() {
      var dispatch = event.of(this, arguments), p = d3.mouse(this), l = location(p), k = Math.log(view.k) / Math.LN2;
      zoomstarted(dispatch);
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
      translateTo(p, l);
      zoomed(dispatch);
      zoomended(dispatch);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ];
  var d3_behavior_zoomDelta, d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
  }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return d3.event.wheelDelta;
  }, "mousewheel") : (d3_behavior_zoomDelta = function() {
    return -d3.event.detail;
  }, "MozMousePixelScroll");
  d3.color = d3_color;
  function d3_color() {}
  d3_color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = d3_hsl;
  function d3_hsl(h, s, l) {
    return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l) : arguments.length < 2 ? h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : new d3_hsl(h, s, l);
  }
  var d3_hslPrototype = d3_hsl.prototype = new d3_color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = d3_hcl;
  function d3_hcl(h, c, l) {
    return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l) : arguments.length < 2 ? h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l) : h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : new d3_hcl(h, c, l);
  }
  var d3_hclPrototype = d3_hcl.prototype = new d3_color();
  d3_hclPrototype.brighter = function(k) {
    return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = d3_lab;
  function d3_lab(l, a, b) {
    return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b) : arguments.length < 2 ? l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b) : l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l) : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b) : new d3_lab(l, a, b);
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_lab.prototype = new d3_color();
  d3_labPrototype.brighter = function(k) {
    return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return new d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : new d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = d3_rgb;
  function d3_rgb(r, g, b) {
    return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b) : arguments.length < 2 ? r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : new d3_rgb(r, g, b);
  }
  function d3_rgbNumber(value) {
    return new d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  var d3_rgbPrototype = d3_rgb.prototype = new d3_color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return new d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_rgb(k * this.r, k * this.g, k * this.b);
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/i.exec(format);
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) return rgb(color.r, color.g, color.b);
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  function d3_identity(d) {
    return d;
  }
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (d3_window.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  function d3_xhrHasResponse(request) {
    var type = request.responseType;
    return type && type !== "text" ? request.response : request.responseText;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }
        return text.slice(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv(" ", "text/tab-separated-values");
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_active, d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      f: false,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now();
    d3_timer_active = d3_timer_queueHead;
    while (d3_timer_active) {
      if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
      d3_timer_active = d3_timer_active.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.f) {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      } else {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping && locale_thousands ? function(value, width) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "-", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false, exponent = true;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
        exponent = false;

       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before, after;
        if (i < 0) {
          var j = exponent ? value.lastIndexOf("e") : -1;
          if (j < 0) before = value, after = ""; else before = value.substring(0, j), after = value.substring(j);
        } else {
          before = value.substring(0, i);
          after = locale_decimal + value.substring(i + 1);
        }
        if (!zfill && comma) before = formatGroup(before, Infinity);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.slice(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.slice(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("w" in d && ("W" in d || "U" in d)) {
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = abs(z) / 60 | 0, zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ _[1], -_[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return rotate([ 0, 0, 90 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, right = x >= sx, bottom = y >= sy, i = (bottom << 1) + right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = sx; else x2 = sx;
        if (bottom) y1 = sy; else y2 = sy;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    a = +a, b = +b;
    return function(t) {
      return a * (1 - t) + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.slice(0, i) : name, m = i >= 0 ? name.slice(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransform(a, b) {
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;
    if (ta[0] != tb[0] || ta[1] != tb[1]) {
      s.push("translate(", null, ",", null, ")");
      q.push({
        i: 1,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: 3,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    } else {
      s.push("");
    }
    if (ra != rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(s.pop() + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(s.pop() + "rotate(" + rb + ")");
    }
    if (wa != wb) {
      q.push({
        i: s.push(s.pop() + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(s.pop() + "skewX(" + wb + ")");
    }
    if (ka[0] != kb[0] || ka[1] != kb[1]) {
      n = s.push(s.pop() + "scale(", null, ",", null, ")");
      q.push({
        i: n - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: n - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] != 1 || kb[1] != 1) {
      s.push(s.pop() + "scale(" + kb + ")");
    }
    n = q.length;
    return function(t) {
      var i = -1, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return (x - a) / b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) / b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight / (t.weight + s.weight));
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, m = candidates.length, x;
        while (++j < m) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ;
    function pie(data) {
      var values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      });
      var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
      var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a) / d3.sum(values);
      var index = d3.range(data.length);
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      var arcs = [];
      index.forEach(function(i) {
        var d;
        arcs[i] = {
          data: data[i],
          value: d = values[i],
          startAngle: a,
          endAngle: a += d * k
        };
      });
      return arcs;
    }
    pie.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return pie;
    };
    pie.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return pie;
    };
    pie.startAngle = function(x) {
      if (!arguments.length) return startAngle;
      startAngle = x;
      return pie;
    };
    pie.endAngle = function(x) {
      if (!arguments.length) return endAngle;
      endAngle = x;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      if (!(n = data.length)) return data;
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var m = series[0].length, n, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = null;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root0 = nodes[0], root1 = wrapTree(root0);
      d3_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      d3_layout_hierarchyVisitBefore(root1, secondWalk);
      if (nodeSize) d3_layout_hierarchyVisitBefore(root0, sizeNode); else {
        var left = root0, right = root0, bottom = root0;
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return nodes;
    }
    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        d3_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null ? sizeNode : null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) == null ? null : sizeNode;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function d3_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function d3_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function d3_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function d3_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_hierarchyVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = 0;
      root.y = 0;
      root.dx = size[0];
      root.dy = size[1];
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, 
      Math.floor), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = (stop - start) / (Math.max(1, domain.length - 1) + padding);
      range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding)), error = stop - start - (domain.length - padding) * step;
      range = steps(start + Math.round(error / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(d3_number).filter(d3_numeric).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function arc() {
      var r0 = innerRadius.apply(this, arguments), r1 = outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset, a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset, da = (a1 < a0 && (da = a0, 
      a0 = a1, a1 = da), a1 - a0), df = da < π ? "0" : "1", c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      return da >= d3_svg_arcMax ? r0 ? "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "M0," + r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + -r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + r0 + "Z" : "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "Z" : r0 ? "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L" + r0 * c1 + "," + r0 * s1 + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0 + "Z" : "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L0,0" + "Z";
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (innerRadius.apply(this, arguments) + outerRadius.apply(this, arguments)) / 2, a = (startAngle.apply(this, arguments) + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcOffset = -halfπ, d3_svg_arcMax = τ - ε;
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.join("L");
  }
  function d3_svg_lineLinearClosed(points) {
    return d3_svg_lineLinear(points) + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] + d3_svg_arcOffset;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset, a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] + d3_svg_arcOffset;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  function d3_transition(groups, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection) {
    return arguments.length ? d3_transitionInheritId ? selection.transition() : selection : d3_selectionRoot.transition();
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, id, node.__transition__[id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node.__transition__[id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id;
    if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node.__transition__[id].tween.remove(name);
    } : function(node) {
      node.__transition__[id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node.__transition__[id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    return this.each("end.transition", function() {
      var p;
      if (this.__transition__.count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node.__transition__[id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node.__transition__[id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node.__transition__[id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      d3_transitionInheritId = id;
      d3_selection_each(this, function(node, i, j) {
        d3_transitionInherit = node.__transition__[id];
        type.call(node, node.__data__, i, j);
      });
      d3_transitionInherit = inherit;
      d3_transitionInheritId = inheritId;
    } else {
      d3_selection_each(this, function(node) {
        var transition = node.__transition__[id];
        (transition.event || (transition.event = d3.dispatch("start", "end"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = Object.create(node.__transition__[id0]);
          transition.delay += transition.duration;
          d3_transitionNode(node, i, id1, transition);
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id1);
  };
  function d3_transitionNode(node, i, id, inherit) {
    var lock = node.__transition__ || (node.__transition__ = {
      active: 0,
      count: 0
    }), transition = lock[id];
    if (!transition) {
      var time = inherit.time;
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        ease: inherit.ease,
        delay: inherit.delay,
        duration: inherit.duration
      };
      ++lock.count;
      d3.timer(function(elapsed) {
        var d = node.__data__, ease = transition.ease, delay = transition.delay, duration = transition.duration, timer = d3_timer_active, tweened = [];
        timer.t = delay + time;
        if (delay <= elapsed) return start(elapsed - delay);
        timer.c = start;
        function start(elapsed) {
          if (lock.active > id) return stop();
          lock.active = id;
          transition.event && transition.event.start.call(node, d, i);
          transition.tween.forEach(function(key, value) {
            if (value = value.call(node, d, i)) {
              tweened.push(value);
            }
          });
          d3.timer(function() {
            timer.c = tick(elapsed || 1) ? d3_true : tick;
            return 1;
          }, 0, time);
        }
        function tick(elapsed) {
          if (lock.active !== id) return stop();
          var t = elapsed / duration, e = ease(t), n = tweened.length;
          while (n > 0) {
            tweened[--n].call(node, e);
          }
          if (t >= 1) {
            transition.event && transition.event.end.call(node, d, i);
            return stop();
          }
        }
        function stop() {
          if (--lock.count) delete lock[id]; else delete node.__transition__;
          return 1;
        }
      }, 0, time);
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickSpacing = Math.max(innerTickSize, 0) + tickPadding, tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text"), sign = orient === "top" || orient === "left" ? -1 : 1, x1, x2, y1, y2;
        if (orient === "bottom" || orient === "top") {
          tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
          text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
        } else {
          tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
          text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
          pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
        }
        lineEnter.attr(y2, sign * innerTickSize);
        textEnter.attr(y1, sign * tickSpacing);
        lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
        textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1, scale0);
        }
        tickEnter.call(tickTransform, scale0, scale1);
        tickUpdate.call(tickTransform, scale1, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = arguments;
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x0, x1) {
    selection.attr("transform", function(d) {
      var v0 = x0(d);
      return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y0, y1) {
    selection.attr("transform", function(d) {
      var v0 = y0(d);
      return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) define(d3); else if (typeof module === "object" && module.exports) module.exports = d3;
  this.d3 = d3;
}();

(function($){
 
    $.fn.extend({ 
         
        leanModal: function(options) {
 
            var defaults = {
                top: 100,
                overlay: 0.5,
                closeButton: null
            }
            
            var overlay = $("<div id='lean_overlay'></div>");
            
            $("body").append(overlay);
                 
            options =  $.extend(defaults, options);
 
            return this.each(function() {
            
                var o = options;
               
                $(this).click(function(e) {
              
                var modal_id = $(this).attr("href");

        $("#lean_overlay").click(function() { 
                     close_modal(modal_id);                    
                });
                
                $(o.closeButton).click(function() { 
                     close_modal(modal_id);                    
                });
                          
                var modal_height = $(modal_id).outerHeight();
              var modal_width = $(modal_id).outerWidth();

            $('#lean_overlay').css({ 'display' : 'block', opacity : 0 });

            $('#lean_overlay').fadeTo(200,o.overlay);

            $(modal_id).css({ 
            
              'display' : 'block',
              'position' : 'fixed',
              'opacity' : 0,
              'z-index': 11000,
              'left' : 50 + '%',
              'margin-left' : -(modal_width/2) + "px",
              'top' : o.top + "px"
            
            });

            $(modal_id).fadeTo(200,1);

                e.preventDefault();
                    
                });
             
            });

      function close_modal(modal_id){

            $("#lean_overlay").fadeOut(200);

            $(modal_id).css({ 'display' : 'none' });
      
      }
    
        }
    });
     
})(jQuery);
/* jshint -W079 */ 

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Clock = (function(_super) {

    __extends(Clock, _super);

    function Clock() {
      this.startTime = __bind(this.startTime, this);
      return Clock.__super__.constructor.apply(this, arguments);
    }

    Clock.prototype.ready = function() {
      return setInterval(this.startTime, 500);
    };

    Clock.prototype.startTime = function() {
      var h, m, s, today;
      today = new Date();
      h = today.getHours();
      m = today.getMinutes();
      s = today.getSeconds();
      m = this.formatTime(m);
      s = this.formatTime(s);
      this.set('time', h + ":" + m + ":" + s);
      return this.set('date', today.toDateString());
    };

    Clock.prototype.formatTime = function(i) {
      if (i < 10) {
        return "0" + i;
      } else {
        return i;
      }
    };

    return Clock;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Comments = (function(_super) {

    __extends(Comments, _super);

    function Comments() {
      this.nextComment = __bind(this.nextComment, this);
      return Comments.__super__.constructor.apply(this, arguments);
    }

    Comments.accessor('quote', function() {
      var _ref;
      return "“" + ((_ref = this.get('current_comment')) != null ? _ref.body : void 0) + "”";
    });

    Comments.prototype.ready = function() {
      this.currentIndex = 0;
      this.commentElem = $(this.node).find('.comment-container');
      this.nextComment();
      return this.startCarousel();
    };

    Comments.prototype.onData = function(data) {
      return this.currentIndex = 0;
    };

    Comments.prototype.startCarousel = function() {
      return setInterval(this.nextComment, 8000);
    };

    Comments.prototype.nextComment = function() {
      var comments,
        _this = this;
      comments = this.get('comments');
      if (comments) {
        return this.commentElem.fadeOut(function() {
          _this.currentIndex = (_this.currentIndex + 1) % comments.length;
          _this.set('current_comment', comments[_this.currentIndex]);
          return _this.commentElem.fadeIn();
        });
      }
    };

    return Comments;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Graph = (function(_super) {

    __extends(Graph, _super);

    function Graph() {
      return Graph.__super__.constructor.apply(this, arguments);
    }

    Graph.accessor('current', function() {
      var points;
      if (this.get('displayedValue')) {
        return this.get('displayedValue');
      }
      points = this.get('points');
      if (points) {
        return points[points.length - 1].y;
      }
    });

    Graph.prototype.ready = function() {
      var container, height, width, x_axis, y_axis;
      container = $(this.node).parent();
      width = (Dashing.widget_base_dimensions[0] * container.data("sizex")) + Dashing.widget_margins[0] * 2 * (container.data("sizex") - 1);
      height = Dashing.widget_base_dimensions[1] * container.data("sizey");
      this.graph = new Rickshaw.Graph({
        element: this.node,
        width: width,
        height: height,
        renderer: this.get("graphtype"),
        series: [
          {
            color: "#fff",
            data: [
              {
                x: 0,
                y: 0
              }
            ]
          }
        ]
      });
      if (this.get('points')) {
        this.graph.series[0].data = this.get('points');
      }
      x_axis = new Rickshaw.Graph.Axis.Time({
        graph: this.graph
      });
      y_axis = new Rickshaw.Graph.Axis.Y({
        graph: this.graph,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT
      });
      return this.graph.render();
    };

    Graph.prototype.onData = function(data) {
      if (this.graph) {
        this.graph.series[0].data = data.points;
        return this.graph.render();
      }
    };

    return Graph;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Iframe = (function(_super) {

    __extends(Iframe, _super);

    function Iframe() {
      return Iframe.__super__.constructor.apply(this, arguments);
    }

    Iframe.prototype.ready = function() {};

    Iframe.prototype.onData = function(data) {};

    return Iframe;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Image = (function(_super) {

    __extends(Image, _super);

    function Image() {
      return Image.__super__.constructor.apply(this, arguments);
    }

    Image.prototype.ready = function() {};

    Image.prototype.onData = function(data) {};

    return Image;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.List = (function(_super) {

    __extends(List, _super);

    function List() {
      return List.__super__.constructor.apply(this, arguments);
    }

    List.prototype.ready = function() {
      if (this.get('unordered')) {
        return $(this.node).find('ol').remove();
      } else {
        return $(this.node).find('ul').remove();
      }
    };

    return List;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Meter = (function(_super) {

    __extends(Meter, _super);

    Meter.accessor('value', Dashing.AnimatedValue);

    function Meter() {
      Meter.__super__.constructor.apply(this, arguments);
      this.observe('value', function(value) {
        return $(this.node).find(".meter").val(value).trigger('change');
      });
    }

    Meter.prototype.ready = function() {
      var meter;
      meter = $(this.node).find(".meter");
      meter.attr("data-bgcolor", meter.css("background-color"));
      meter.attr("data-fgcolor", meter.css("color"));
      return meter.knob();
    };

    return Meter;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Number = (function(_super) {

    __extends(Number, _super);

    function Number() {
      return Number.__super__.constructor.apply(this, arguments);
    }

    Number.accessor('current', Dashing.AnimatedValue);

    Number.accessor('difference', function() {
      var current, diff, last;
      if (this.get('last')) {
        last = parseInt(this.get('last'));
        current = parseInt(this.get('current'));
        if (last !== 0) {
          diff = Math.abs(Math.round((current - last) / last * 100));
          return "" + diff + "%";
        }
      } else {
        return "";
      }
    });

    Number.accessor('arrow', function() {
      if (this.get('last')) {
        if (parseInt(this.get('current')) > parseInt(this.get('last'))) {
          return 'icon-arrow-up';
        } else {
          return 'icon-arrow-down';
        }
      }
    });

    Number.prototype.onData = function(data) {
      if (data.status) {
        $(this.get('node')).attr('class', function(i, c) {
          return c.replace(/\bstatus-\S+/g, '');
        });
        return $(this.get('node')).addClass("status-" + data.status);
      }
    };

    return Number;

  })(Dashing.Widget);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Text = (function(_super) {

    __extends(Text, _super);

    function Text() {
      return Text.__super__.constructor.apply(this, arguments);
    }

    return Text;

  })(Dashing.Widget);

}).call(this);

(function() {

  console.log("Yeah! The dashboard has started!");

  Dashing.on('ready', function() {
    var contentWidth;
    Dashing.widget_margins || (Dashing.widget_margins = [5, 5]);
    Dashing.widget_base_dimensions || (Dashing.widget_base_dimensions = [300, 360]);
    Dashing.numColumns || (Dashing.numColumns = 4);
    contentWidth = (Dashing.widget_base_dimensions[0] + Dashing.widget_margins[0] * 2) * Dashing.numColumns;
    return Batman.setImmediate(function() {
      $('.gridster').width(contentWidth);
      return $('.gridster ul:first').gridster({
        widget_margins: Dashing.widget_margins,
        widget_base_dimensions: Dashing.widget_base_dimensions,
        avoid_overlapped_widgets: !Dashing.customGridsterLayout,
        draggable: {
          stop: Dashing.showGridsterInstructions,
          start: function() {
            return Dashing.currentWidgetPositions = Dashing.getWidgetPositions();
          }
        }
      });
    });
  });

}).call(this);
