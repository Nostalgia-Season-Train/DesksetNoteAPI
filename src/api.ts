import Koa from 'koa'
import { Server } from 'http'

import { App } from 'obsidian'

import Obsidian from './router/obsidian'
import routerDataview from './router/dataview'


export default class DesksetNoteAPI {
    app: App

    server: Koa
    listen: Server | null

    constructor(app: App) {
        this.app = app

        this.server = new Koa()
        this.server.use((new Obsidian(this.app)).routes())
        this.server.use(routerDataview.routes())

        this.listen = null
    }

    open(port: Number) {
        this.close()
        this.listen = this.server.listen(port)
    }

    close() {
        if (this.listen != null) {
            this.listen.close()
        }
    }
}
