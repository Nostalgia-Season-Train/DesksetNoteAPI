import Koa from 'koa'

import { Server } from 'http'


export default class DesksetNoteAPI {
    app: Koa
    listen: Server | null

    constructor() {
        this.app = new Koa()

        this.app.use(async (ctx: { body: string; }) => {
            ctx.body = 'Hello World'
        })

        this.listen = null
    }

    open(port: Number) {
        this.close()
        this.listen = this.app.listen(port)
    }

    close() {
        if (this.listen != null) {
            this.listen.close()
        }
    }
}
