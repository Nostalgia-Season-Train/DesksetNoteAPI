/* Obsidian 本体交互 */
import { App } from 'obsidian'

import Router from '@koa/router'

// 类型注解
import { FileSystemAdapter } from 'obsidian'

export default class Obsidian {
    router: Router
    app: App

    constructor(app: App) {
        this.router = new Router({ prefix: '/obsidian' })
        this.app = app

        // 路由注册
        this.router.get('/current-vault', async (ctx, next) => {
            const vaultpath = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
            const vaultname = this.app.vault.getName()
            ctx.body = {
                vaultpath: vaultpath || '',
                vaultname: vaultname || ''
            }
        })

        this.router.get('/current-note', (ctx, next) => {
            const relpath = this.app.workspace.getActiveFile()?.path
            ctx.body = relpath || ''
        })
    }

    public routes() {
        return this.router.routes()
    }
}
