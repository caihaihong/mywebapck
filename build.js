const fs = require("fs"); // 文件读取
const babylon = require("babylon"); // 获得ast
const traverse = require("babel-traverse").default; // 转译 ES2015+
const path = require("path");
const babel = require("babel-core");

let id = 0;
function createAssets(fileName) {
  const content = fs.readFileSync(fileName, "utf-8"); 
  const ast = babylon.parse(content, { sourceType: "module" });
  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["env"],
  });
  return {
    id: id++,
    fileName,
    dependencies,
    code,
  };
}

const createGragh = (entry) => {
  const mainAssets = createAssets(entry); // 这个就是我们上面函数返回的对象
  console.log("mainAssets", mainAssets);
  const queue = [mainAssets];
  for (const asset of queue) {
    asset.mapping = {}; // 给 createAssets 函数返回的对象，增加一个mapping 映射的属性，是一个对象
    const dirname = path.dirname(asset.fileName);
    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = createAssets(absolutePath); // 递归
      asset.mapping[relativePath] = child.id; // 这里的作用是，例如我们`require('./message.js')，就可以通过mapping映射，找到对应的是哪个模块id。
      queue.push(child);
    });
  }
  console.log(queue) // 可以打印查看这个数组
  return queue;
};
const graph = createGragh("./example/index.js");

function bundle(graph) {
  // 我们要构建一个字符串对象
  let modules = "{";
  graph.forEach((module) => {
    // 这里就是 key:value
    // key 是 模块的i
    // value 是一个数组[fn,mapping]，fn函数传入 require,module,exports 这三个变量，函数体是我们每个模块的源代码
    // 因为我们传入了 require,module,exports这三个变量，所以我们正在源文件，就可以直接使用者三个变量了。
    modules += `${module.id}:[function(require,module,exports){${
      module.code  //每个模块的源代码
    }},${JSON.stringify(module.mapping)}],`;
  });
  modules+="}"
    
  const result = `;(function(modules){
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
    
  })(${modules})`;
  return result;
}

const result = bundle(graph);
console.log("reault", result);

function writeJs(fileName, content) {
  let writeStream = fs.createWriteStream(`./${fileName}.js`, {
    encoding: "utf8",
  });
  writeStream.write(content);
  writeStream.end();
}
writeJs("dist", result);