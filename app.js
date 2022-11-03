const Koa = require("koa")
const route = require('koa-route');
const fs = require('fs')
const Path = require('path')
const cors = require('koa-cors')
const bodyparser = require('koa-bodyparser')
const { nanoid } = require('nanoid');
const app = new Koa();

const { PORT, HOST} = require('./config');

app.use(cors({
    // 任何地址都可以访问
    origin:"*",
    maxAge: 5,
    // 必要配置
    credentials: true
}))
app.use(bodyparser())

// 测试接口
const test = async ctx => {
    const { delay = 1, count } = ctx.query
    const result = await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({
                code: 0,
                success: count && count > 2,
                data: nanoid(),
            })
        }, delay * 1000)
    })
    ctx.body = result
}

// 上传图片
const uploadImg = async ctx => {
    const { base64 } = ctx.request.body
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");

    const dataBuffer = Buffer.from(base64Data, 'base64');

    const imgName = `${nanoid()}.${/^data:image\/(\w+);base64,/.exec(base64)[1]}`

    const path = Path.resolve(__dirname, './images')

    try {
        const result = await new Promise((resolve,rejects) => {
            fs.writeFile(`${path}/${imgName}`, dataBuffer, (err) => {
                if(err){
                    rejects({
                        code: 1, 
                        msg: err
                    })
                }else{
                    resolve({
                        code: 0, 
                        data: {
                            url: HOST + imgName,
                            imgName
                        }
                    })
                }
            });
        })
    
        ctx.body = result
    } catch(e) {
        console.log(`upload:${e}`);
    }
}

// 删除图片
const deleteImg = async ctx => {
    const { imgName } = ctx.request.body

    if (!imgName) {
        ctx.body = {
            code: 1,
            msg: '参数错误'
        }
        return
    }

    const path = Path.join(__dirname, `images/${imgName}`)

    try {
        let result = ''
        if (fs.existsSync(path)) {
            result = await new Promise((resolve, rejects) => {
                fs.unlink(path, err => {
                    if (err) {
                        rejects({
                            code: 1,
                            msg: err
                        })
                    } else {
                        resolve({
                            code: 0,
                            msg: '删除成功'
                        })
                    }
                })
            })
        } else {
            result = {
                code: 1,
                msg: '找不到指定的文件'
            }
        }
    
        ctx.body = result
    } catch(e) {
        console.log(`delete:${e}`);
    } 
}

// 获取所有图片
const imgList = async ctx => {

    const path = Path.resolve(__dirname, './images')

    try {
        const result = await new Promise((resolve,rejects) => {
            fs.readdir(path, (err, data) => {
                if(err){
                    rejects({
                        code: 1, 
                        msg: err
                    })
                }else{
                    const handleList = data.map(i => {
                        return {
                            url: HOST + i,
                            imgName: i
                        }
                    })
                    resolve({
                        code: 0, 
                        data: handleList
                    })
                }
            });
        })
    
        ctx.body = result
    } catch(e) {
        console.log(`imgList:${JSON.stringify(e)}`);
    }
}

// 注册路由
app.use(route.get('/test', test))
app.use(route.get('/imgList', imgList))
app.use(route.post('/uploadImg', uploadImg))
app.use(route.post('/deleteImg', deleteImg))

app.listen(PORT, () => {
    console.log(`端口：${PORT}，服务启动成功...`);
})