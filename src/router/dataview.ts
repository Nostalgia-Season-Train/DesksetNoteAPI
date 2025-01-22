/* Obsidian 插件交互：Dataview */

import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'
import { getAPI } from 'obsidian-dataview'

// 注：Dataview 是数字桌搭与 Obsidian 交互的核心插件，访问路径将直接用 /dataview 而非 /plugin/dataview
const routerDataview = new Router({ prefix: '/dataview' })
routerDataview.use(bodyParser())

const dv = getAPI()


routerDataview.get('/page/:relpath*', (ctx, next) => {
    const relpath = ctx.params.relpath
    ctx.body = dv.page(relpath) || ''
})

routerDataview.post('/query', async (ctx, next) => {
    const source = ctx.request.body?.source
    ctx.body = await dv.query(source)
})


export default routerDataview
