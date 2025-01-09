import Koa from 'koa'
import Router from '@koa/router'

import { Server } from 'http'

const router = new Router()

router.get('/', (ctx, next) => {
    ctx.body = 'Hello World From Router'
})


export default class DesksetNoteAPI {
    app: Koa
    listen: Server | null

    constructor() {
        this.app = new Koa()
        this.app.use(router.routes())

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
