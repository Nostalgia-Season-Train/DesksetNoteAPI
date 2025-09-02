import { App, Plugin, request, moment } from 'obsidian'
import { DesksetPluginSetting as Setting } from './core/setting'

import Unify from './unify'

import RpcServer from './rpc'

import { Notice } from 'obsidian'


export default class DesksetNoteAPI {
    private _app: App
    private _setting: Setting
    private _plugin: Plugin

    private _unify: Unify

    private _address: string
    private _notetoken: string
    private _websocket: WebSocket | null
    private _rpc: RpcServer | null

    constructor(app: App, setting: Setting, plugin: Plugin) {
        this._app = app
        this._setting = setting  // 对 setting 的引用，因为 Unify 也会修改并保存 setting
        this._plugin = plugin

        this._unify = new Unify(this._app)

        this._address = `${this._setting.host}:${this._setting.port}`
        this._notetoken = ''
        this._websocket = null
        this._rpc = null

        // 注册事件监听
          // 其他地方注册的监听器，断开连接后可能继续发送消息
        this._app.workspace.on('active-leaf-change', async () => this._websocket?.send(JSON.stringify({
            datetime: moment().toISOString(true),
            event: 'active-leaf-change',
            value: null
        })))
    }

    async open() {
        if (this._websocket != null)
            return

        // 初始化
        this._notetoken = (await request({
            url: `http:${this._setting.host}:${this._setting.port}/v0/access/note/obsidian/login`,
            method: 'post',
            contentType: 'application/x-www-form-urlencoded',
            body: new URLSearchParams({
                username: this._setting.username,
                password: this._setting.password
            }).toString(),
            headers: {
                'Sec-Deskset-NoteAPI': 'PNA'
            }
        })).slice(1, -1)  // 去掉字符串双引号...
        this._websocket = new WebSocket(
            `ws://${this._setting.host}:${this._setting.port}/v0/note/obsidian-manager/rpc`,
            ['Authorization', `bearer-${this._notetoken}`]
        )
        this._rpc = new RpcServer(this._websocket, this._unify, this._app, this._plugin)
        console.log('NoteAPI %conline', 'color: green;', `for '${this._address}' address and '${this._notetoken}' token`)

        // 退出事件：连接关闭、连接失败
        this._websocket.onclose = async () => {
            await this.close()
        }
        this._websocket.onerror = async () => {
            await this.close()
        }

        // 发出通知，提醒用户连接成功
        new Notice('成功连接数字桌搭')
    }

    async close() {
        if (this._websocket == null) {
            // Obsidian 终止连接：close > _websocket.close/onclose > close 重复调用
            // DesksetBack 终止连接：_websocket.onclose > close > _websocket.close 已经关闭，不再触发 _websocket.onclose
            return
        }

        this._rpc = null
        this._websocket.close()
        this._websocket = null
        console.log('NoteAPI %coffline', 'color: red;', `for '${this._address}' address and '${this._notetoken}' token`)
    }
}
