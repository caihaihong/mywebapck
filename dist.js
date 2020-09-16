;(function(modules){
    // 声明 require 函数
    function require(id) {
      const [fn, mapping] = modules[id]; // 拿到函数，以及mapping
      function localRequire(relativePath) {
        return require(mapping[relativePath]);
      }
      const module = { exports: {} };
      fn(localRequire, module, module.exports); // 执行函数，也就是我们的真实代码，并且传进一个module对象，函数体内，赋值到这个对象，利用对象引用的原理，函数外部的对象module就有值了。
      return module.exports;  // 返回函数的返回值。
    }
    // 执行我们的第一个模块文件
    require(0);
    
  })({0:[function(require,module,exports){"use strict";

var _message = require("./message.js");

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_message2.default);},{"./message.js":1}],1:[function(require,module,exports){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _test = require("./test.js");

exports.default = "hello " + _test.name;},{"./test.js":2}],2:[function(require,module,exports){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var name = exports.name = "caicai";},{}],})