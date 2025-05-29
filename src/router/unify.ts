/* ==== 依赖 ==== */
import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'

import { randomString } from '../core/random'

const ENABLE_CHECK = true  // 启用检查：检查初始化和密钥


/* ==== 类型注解 ==== */
import { App, FileSystemAdapter } from 'obsidian'
import { DesksetPluginSetting as Setting } from '../core/setting'


export default class Unify {
    router: Router
    app: App
    setting: Setting
    private _address: string
    private _token: string

    private _ws_event: WebSocket | null

    constructor(app: App, setting: Setting, address: string) {
        this.router = new Router({ prefix: '/unify' })
          .use(bodyParser())
        this.app = app
        this.setting = setting
        this._address = address
        this._token = randomString(50, 75)

        this._ws_event = null

        this.router.post('/login-in', this._loginIn)
        this.router.use(this.check.bind(this))  // bind 让 check 中的 this 指向自身
    }

    async check(ctx: any, next: any) {
        if (ENABLE_CHECK) {
            // 检查密钥
            if (ctx.headers.authorization != 'Bearer ' + this._token)
                ctx.throw(403, 'Invalid token')
        }
        await next()
    }

    private _loginIn = async (ctx: any, next: any) => {
        const username = ctx.request.body.username
        const password = ctx.request.body.password
        if (username != this.setting.username || password != this.setting.password)
            ctx.throw(400, 'Incorrect username or password')

        const address = ctx.request.body.backaddress
        const token = ctx.request.body.backtoken
        if (this._ws_event?.readyState == WebSocket.OPEN)
            ctx.throw(500, 'ws-event already init', { expose: true })

        this._ws_event = new WebSocket(`ws://${address}/v0/note/obsidian-manager/ws-event`, ['Authorization', `bearer-${token}`])

        // 上线
          // 必须保证第一个发送，初始化 Back 中的 NoteAPI
        this._ws_event.onopen = () => {
            this._ws_event?.send(JSON.stringify({
                address: this._address,
                token: this._token,
                path: (this.app.vault.adapter as FileSystemAdapter).getBasePath(),
                setting: this.setting
            }))
            console.log('NoteAPI %conline', 'color: green;', `for '${address}' address and '${token}' token`)
        }

        // 下线
          // api.close 关闭时清理顺序 ws_event.close() => listen.close() => ws_event.onclose()
            // 确保 ws_event.close() 在 listen.close() 之前就行
        this._ws_event.onclose = () => {
            // 过滤初始化失败（先后触发 onerror => onclose）
            if (this._ws_event == null)
                return

            this._ws_event = null
            console.log('NoteAPI %coffline', 'color: red;', `for '${address}' address and '${token}' token`)
        }

        // 出错
        this._ws_event.onerror = () => {
            this._ws_event = null
            console.log('ws-event error')
        }

        ctx.body = 'Receive'  // WebSocket 没有连接成功的 Promise...
    }

    async offline() {
        if (this._ws_event?.readyState != WebSocket.OPEN)
            return
        this._ws_event.close()
    }
}
