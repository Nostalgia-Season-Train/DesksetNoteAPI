/* Obsidian 本体交互 */

import Router from '@koa/router'
import { App } from 'obsidian'


export default class Obsidian {
    router: Router
    app: App

    constructor(app: App) {
        this.router = new Router({ prefix: '/obsidian' })
        this.app = app

        // 路由注册
        this.router.get('/current-note', (ctx, next) => {
            const relpath = this.app.workspace.getActiveFile()?.path
            ctx.body = relpath || ''
        })
    }

    public routes() {
        return this.router.routes()
    }
}
