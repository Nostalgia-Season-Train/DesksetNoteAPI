import Koa from 'koa'
import { Server } from 'http'

import { App } from 'obsidian'
import { DesksetPluginSetting as Setting } from './core/setting'

import Unify from './router/unify'

import Note from './feature/note'

import Obsidian from './router/obsidian'
import routerDataview from './router/dataview'
import Diary from './router/diary'
import Tasks from './router/tasks'
import Stats from './router/stats'


export default class DesksetNoteAPI {
    app: App
    setting: Setting

    note: Note

    server: Koa
    listen: Server | null

    unify: Unify

    constructor(app: App, setting: Setting) {
        this.app = app
        this.setting = structuredClone(setting)  // 深拷贝确保不随外部 setting 更改

        this.note = new Note(this.app)

        this.server = new Koa()
        this.listen = null

        /* 仅允许本机 127.0.0.1 访问 */
        this.server.use(this.check_127host)

        /* 统一认证&初始化 */
        this.unify = new Unify(this.app, this.setting)
        this.server.use(this.unify.router.routes())
        this.server.use(this.unify.check.bind(this.unify))  // 这里也要 bind...

        /* 路由 */
        this.server.use((new Obsidian(this.app)).routes())
        this.server.use(routerDataview.routes())
        this.server.use((new Diary(this.app, this.note)).router.routes())
        this.server.use((new Tasks(this.app)).router.routes())
        this.server.use((new Stats(this.app)).router.routes())
    }

    check_127host = async (ctx: any, next: any): Promise<void> => {
        if (ctx.req.socket.remoteAddress != '127.0.0.1') {
            ctx.throw(403, 'Access denied. Only requests from 127.0.0.1 are allowed.')
        }
        await next()
    }

    async open() {
        if (this.listen != null)
            throw Error('NoteAPI Server already open')

        this.listen = this.server.listen({ host: this.setting.host, port: this.setting.port })
        console.log(`NoteAPI open on ${this.setting.host}:${this.setting.port}`)
    }

    async close() {
        if (this.listen == null)
            throw Error('NoteAPI Server already close')

        await this.unify.offline()

        this.listen.close()
        this.listen = null
        console.log(`NoteAPI close on ${this.setting.host}:${this.setting.port}`)
    }
}
