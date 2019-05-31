## Koa

#### 项目结构
- application.js 
  - use 
  - listen 
  - handleRequest 
  - creatContext 
  - compose 
- context.js 
  - defineGetter 
  - defineSetter 
- request.js 
- response.js 

#### application.js 实现Koa类
```
let http = require('http');
let context = require('./context');
let request = require('./request');
let response = require('./response');
let EventEmitter = require('events');
let Stream = require('stream');
class Koa extends EventEmitter{
    constructor(){
        super();
        this.context = Object.create(context); // 这样是一个新的对象不会影响引入的
        this.request = Object.create(request);
        this.response = Object.create(response);
        this.middlewares = [];
    },
    use(){},
    createContext(){},
    compose(){},
    handleRequest(){},
    listen(){}
}
module.exports = Koa;
```

###### use 注册中间件
```
use(fn) {
    this.middlewares.push(fn);
}
```

###### createContext 创建上下文 以及与其他文件的对应关系
```
//     console.log(ctx.req.url);  
//     console.log(ctx.request.url);
//     console.log(ctx.request.req.url);
//     console.log(ctx.url);

createContext(req, res) { // 自己封装request 和response属性
    let ctx = this.context;
    ctx.request = this.request;
    ctx.req = ctx.request.req = req; // 请求相关的

    ctx.response = this.response;
    ctx.res = ctx.response.res = res; // 响应相关的
    return ctx;
  }
```
###### compose 组合中间件方法
```
compose(middles, ctx) {
    // dispatch 实现迭代
    function dispatch(index) {
      // 如果没有注册中间件 需要返回一个成功的promise
      if(index === middles.length) return Promise.resolve();
      let middle = middles[index];
      // 让第一个函数执行完 如果有异步要看一看 有没有await, 必须要返回一个promise 
      return Promise.resolve(middle(ctx, () => dispatch(index + 1)));
    }
    return dispatch(0);

    // reduce 写法 下面执行的时候要传入ctx=>fn(ctx)
    return  middles.reduce((a, b) => {
        return (ctx) =>{
            return Promise.resolve(b(ctx,()=>a));
        }
    });

    // reduceRight写法
    return middles.reduceRight((a,b)=>{
        return (ctx)=>{
            return Promise.resolve(a(ctx,()=>b))
        }
    })

  }
```

###### handleRequset 处理用户请求到来时及响应结果
```
// 处理用户请求到来时
  handleRequest(req, res) {
    let ctx = this.createContext(req, res);
    res.statusCode = 404; //默认我就认为你返回的404没有调用ctx.body;
    let fn = this.compose(this.middlewares, ctx);
    // 把所有的函数进行组合 当组合的函数执行成功后 把最终的结果进行响应
    fn.then(()=>{
      if (!ctx.body){
        res.end('Not Found')
      } else if (ctx.body instanceof Stream){
        res.setHeader('Content-Type','text/html;charset=utf-8')
        ctx.body.pipe(res);
      }else if (typeof ctx.body ==='object'){
        res.setHeader('Content-Type','application/json;charset=utf-8');
        res.end(JSON.stringify(ctx.body));
      }else{ 
        res.end(ctx.body); // 用res.end结束
      }
    }).catch(err=>{
      this.emit('error',err);
    })
  }
```

###### listen 启动http服务
```
listen(...args) {
    // 启动服务
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(...args);
  }
```

#### context 处理代理关系
```
let context = {};
// 如果去context 上去值 去context.request上取

function defineGetter(key,property) { // 定义获取器
  context.__defineGetter__(property, function () {
    return this[key][property];
  })
}
// 给某个属性定义setter
function defineSetter(key,property) {
  context.__defineSetter__(property, function (value) {
    this[key][property] = value
  })
}
// 代理 把取属性的值 通过request来获取
defineGetter('request','path');
defineGetter('request','url');
defineGetter('request','query');
// ctx.body => ctx.response.body;
defineGetter('response','body');
// ctx.body = '100'  ctx.response.body = '100'
defineSetter('response','body');


module.exports = context
```

#### request 处理请求相关
```
let url = require('url')
let request = {
  get url(){
    return this.req.url;
  },
  get path(){
    let { pathname } = url.parse(this.req.url);
    return pathname
  },
  get query() {
    let { query } = url.parse(this.req.url,true);
    return query
  }
};

module.exports = request;

```

#### response 处理响应相关
```
let response = {
  set body(value){
    this.res.statusCode = 200; // 调用ctx.body="xxx" 表明成功了
    this._body = value;
  },
  get body(){
    return this._body
  }
};

module.exports = response;
```