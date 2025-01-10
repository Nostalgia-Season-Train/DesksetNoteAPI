/* Obsidian 插件交互：Dataview */

import Router from '@koa/router'
import { getAPI } from 'obsidian-dataview'

// 注：Dataview 是数字桌搭与 Obsidian 交互的核心插件，访问路径将直接用 /dataview 而非 /plugin/dataview
const routerDataview = new Router({ prefix: '/dataview' })
const dvapi = getAPI()


routerDataview.get('/page/:relpath*', (ctx, next) => {
    const relpath = ctx.params.relpath
    ctx.body = dvapi.page(relpath) || ''
})


export default routerDataview
