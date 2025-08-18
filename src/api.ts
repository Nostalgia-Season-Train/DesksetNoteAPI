import { App, Plugin, request } from 'obsidian'
import { DesksetPluginSetting as Setting } from './core/setting'

import Note from './feature/note'
import Unify from './unify'

import RpcServer from './rpc'

import { Notice } from 'obsidian'


export default class DesksetNoteAPI {
    private _app: App
    private _setting: Setting
    private _plugin: Plugin

    private _note: Note
    private _unify: Unify

    private _address: string
    private _notetoken: string
    private _websocket: WebSocket | null
    private _rpc: RpcServer | null

    constructor(app: App, setting: Setting, plugin: Plugin) {
        this._app = app
        this._setting = setting  // 对 setting 的引用，因为 Unify 也会修改并保存 setting
        this._plugin = plugin

        this._note = new Note(this._app)
        this._unify = new Unify(this._app)

        this._address = `${this._setting.host}:${this._setting.port}`
        this._notetoken = ''

        this._websocket = null
        this._rpc = null
    }

    async open() {
        if (this._websocket != null)
            return

        // 初始化
        this._notetoken = (await request({
            url: `http:${this._setting.host}:${this._setting.port}/v0/access/note/login`,
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
        if (this._websocket == null)
            return

        this._websocket.close()
        this._websocket = null
        this._rpc = null
        console.log('NoteAPI %coffline', 'color: red;', `for '${this._address}' address and '${this._notetoken}' token`)
    }
}
