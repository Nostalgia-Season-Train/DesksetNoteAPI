import Koa from 'koa'
import { Server } from 'http'

import { App } from 'obsidian'

import Note from './feature/note'

import Obsidian from './router/obsidian'
import routerDataview from './router/dataview'
import Diary from './router/diary'
import Tasks from './router/tasks'
import Stats from './router/stats'


export default class DesksetNoteAPI {
    app: App

    note: Note

    server: Koa
    listen: Server | null

    constructor(app: App) {
        this.app = app

        this.note = new Note(this.app)

        this.server = new Koa()
        this.server.use((new Obsidian(this.app)).routes())
        this.server.use(routerDataview.routes())
        this.server.use((new Diary(this.app, this.note)).router.routes())
        this.server.use((new Tasks(this.app)).router.routes())
        this.server.use((new Stats(this.app)).router.routes())

        this.listen = null
    }

    open(host: string, port: number) {
        this.close()
        this.listen = this.server.listen({ host: host, port: port })
    }

    close() {
        if (this.listen != null) {
            this.listen.close()
        }
    }
}
