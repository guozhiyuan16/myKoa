let http = require('http');
let context = require('./context');
let request = require('./request');
let response = require('./response');
let EventEmitter = require('events');
let Stream = require('stream');


class Koa extends EventEmitter{
    constructor(){
        super();
        this.middlewara;
        this.context = Object.create(context);
        this.request = Object.create(request);
        this.response = Object.create(response);
        this.middlewaras = []
    }
    use(fn){
        // this.middlewara = fn;
        this.middlewaras.push(fn);
    }

    createContext(req,res){
        let ctx = this.context;
        ctx.request = this.request;
        ctx.req = ctx.request.req = req;

        ctx.response = this.response;
        ctx.res = ctx.response.res = res;

        return ctx;
    }

    compose(middles,ctx){
        // function dispatch(index){
        //     if(index === middles.length) return Promise.resolve();
        //     let middle = middles[index];
        //     console.log('middle',middle.toString());
        //     return Promise.resolve(middle(ctx,()=>dispatch(index+1)));
        // }
        // return dispatch(0)

        if(middles.length === 0) return ()=>Promise.resolve();

        // reduce 写法
        // return  middles.reduce((a, b) => {
        //     return (ctx) =>{
        //         return Promise.resolve(b(ctx,()=>a));
        //     }
        // });

        // reduceRight写法
        return middles.reduceRight((a,b)=>{
            return (ctx)=>{
                return Promise.resolve(a(ctx,()=>b))
            }
        })
      
    }

    handleRequest(req,res){
        let ctx = this.createContext(req,res);
        // this.middlewara(ctx)
        res.statusCode = 404;

        // let fn = this.compose(this.middlewaras);
        // console.log('fn',fn.toString());
        // fn(ctx);
        // res.end(ctx.body);

        let fn = this.compose(this.middlewaras);
        fn(ctx).then(()=>{
            if(!ctx.body){
                res.end('Not Found')
            }else if(this.ctx instanceof Stream){
                res.setHeader('Content-Type','text/html;charset=utf-8');
                ctx.body.pipe(res);
            }else if(typeof ctx.body === 'object'){
                res.setHeader('Content-Type','application/json;charset-utf-8');
                res.end(JSON.stringify(ctx.body))
            }else{
                res.end(ctx.body);
            }
            
        })
        .catch((err)=>{
           this.emit('error',err)
        })
        
    }

    listen(...arg){
       let server =  http.createServer(this.handleRequest.bind(this));
       server.listen(...arg);
    }

}

module.exports = Koa;