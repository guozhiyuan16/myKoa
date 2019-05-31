let Koa = require('./koa/application');

let app = new Koa;

// app.use((ctx,next)=>{
//     // res.end('hello world!')
//     console.log(ctx.req.url);
//     console.log(ctx.request.url);
//     console.log(ctx.request.req.url);
//     console.log(ctx.url);
    
//     ctx.body = 'hello world!';
//     console.log(ctx.response.body)
// })

app.use(async (ctx,next)=>{
    ctx.body = 'hello';
    await next();
})

app.use(async (ctx,next)=>{
    ctx.body = 'world';
    await next();
})

app.use((ctx,next)=>{
    ctx.body = 'gzy';
    
})

// app.use((ctx,next)=>{
//     ctx.body = 'hello';
//     next();
// })

// app.use((ctx,next)=>{
//     ctx.body = 'world';
//     next();
// })

// app.use((ctx,body)=>{
//     ctx.body = 'gzy'
// })

app.listen(3000);