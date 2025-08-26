import { App, Plugin, moment } from 'obsidian'

export default class RpcServer {
    private _websocket: WebSocket
    private _instance: any
    private _app: App
    private _plugin: Plugin

    constructor(
        websocket: WebSocket,
        instance: any,
        app: App,
        plugin: Plugin
    ) {
        this._instance = instance
        this._app = app
        this._plugin = plugin

        this._websocket = websocket
        this._websocket.onmessage = this.onRecevie.bind(this)
    }

    private onRecevie = async (msg: MessageEvent) => {
        const request = JSON.parse(msg.data)

        let result, error
        try {
            result = await this._instance[request.procedure](...request.args)
        } catch (err) {
            error = err
        }

        this._websocket.send(
            JSON.stringify({
                id: request.id,
                payload: result,
                error: {
                    name: error?.name,
                    message: error?.message,
                    stack: error?.stack
                }
            })
        )
    }

    helloworld = async () => {
        return 'helloworld'
    }

    listen = async () => {
        // 两种注销方式：
          // 被动注销：通过 registerEvent 在插件卸载时被动注销
          // 主动注销：调用 unlisten 主动注销
        this._plugin.registerEvent(this._app.workspace.on('active-leaf-change', this._callback_active_leaf_change))
    }

    unlisten = async () => {
        this._app.workspace.off('active-leaf-change', this._callback_active_leaf_change)
    }

    private _callback_active_leaf_change = async () => {
        this._websocket.send(JSON.stringify({
            datetime: moment().toISOString(true),
            event: 'active-leaf-change',
            value: null
        }))
    }
}
