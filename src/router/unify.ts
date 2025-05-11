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

    // 下线状态：is_init = false、backinfo == null
    // 上线状态：is_init = true 、backinfo != null

    // 状态：下线 => 上线
      // 1、Back login 登入 NoteAPI，同时传递自身 address 和 token

    // 状态：上线 => 下线
      // 1、Back login 登出 NoteAPI
      // 2、api close 端口
      // 3、任意一次连接 Back 失败

    // 注：登出 backinfo 需跟登入一致，否则登出失败
    private _is_init: boolean
    private _backinfo: { address: string, token: string } | null

    constructor(app: App, setting: Setting) {
        this.router = new Router({ prefix: '/unify' })
          .use(bodyParser())
        this.app = app
        this.setting = setting
        this._address = `${this.setting.host}:${this.setting.port}`
        this._token = randomString(50, 75)

        this._is_init = false
        this._backinfo = null

        this.router.post('/login-in', this._loginIn)
        this.router.use(this.check.bind(this))  // bind 让 check 中的 this 指向自身
        this.router.post('/login-out', this._loginOut)
    }

    async check(ctx: any, next: any) {
        if (ENABLE_CHECK) {
            // 检查初始化
            if (!this._is_init)
                ctx.throw(403, 'Not Init', { expose: true })
            // 检查密钥
            if (ctx.headers.authorization != 'Bearer ' + this._token)
                ctx.throw(403, 'Invalid token')
        }
        await next()
    }


    /* --- 上线下线 --- */

    async goOnline(address: string, token: string): Promise<void | Error> {
        if (this._is_init) return Error('NoteAPI already online')  // 已经上线

        try {
            const adapter = this.app.vault.adapter as FileSystemAdapter
            const data = await (await fetch(`http://${address}/v0/note/obsidian-manager/noteapi/online`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    address: this._address,
                    token: this._token,
                    vault: adapter.getBasePath()
                })
            })).json()
            if (data?.success != true) return Error(`Online Fail. From Back Response Error: ${data?.message}`)
        } catch (error) {
            return Error(`Online Fail. From Back Connect Error: ${error}`)
        }

        this._backinfo = { address: address, token: token }
        this._is_init = true
        console.log('NoteAPI %conline', 'color: green;', `for ${this._backinfo.address} address and ${this._backinfo.token.slice(0, 5)} token`)
    }

    async goOffline(): Promise<void | Error> {
        if (!this._is_init) return Error('NoteAPI already offline')  // 已经下线

        try {
            const data = await (await fetch(`http://${this._backinfo?.address}/v0/note/obsidian-manager/noteapi/offline`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._backinfo?.token, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ address: this._address, token: this._token })
            })).json()
            if (data?.success != true) return Error(`Offline with From Back Response Error: ${data?.message}`)
        } catch (error) {
            return Error(`Offline with From Back Connect Error: ${error}`)
        } finally {
            // 请求和连接失败，也会切换回下线状态
            console.log('NoteAPI %coffline', 'color: red;', `for ${this._backinfo?.address} address and ${this._backinfo?.token.slice(0, 5)} token`)
            this._backinfo = null
            this._is_init = false
        }
    }


    /* --- 登入登出 --- */

    private _loginIn = async (ctx: any, next: any) => {
        const username = ctx.request.body.username
        const password = ctx.request.body.password
        if (username != this.setting.username || password != this.setting.password)
            ctx.throw(400, 'Incorrect username or password')

        const address = ctx.request.body.backaddress
        const token = ctx.request.body.backtoken
        const transfer_result = await this.goOnline(address, token)
        if (transfer_result instanceof Error)
            ctx.throw(500, transfer_result, { expose: true })

        ctx.body = 'Online Success'
    }

    private _loginOut = async (ctx: any, next: any) => {
        const address = ctx.request.body.backaddress
        const token = ctx.request.body.backtoken
        if (this._backinfo?.address != address || this._backinfo?.token != token)
            ctx.throw(500, 'Different backinfo', { expose: true })

        const transfer_result = await this.goOffline()
        if (transfer_result instanceof Error)
            ctx.throw(500, transfer_result, { expose: true })

        ctx.body = 'Offline Success'
    }
}
