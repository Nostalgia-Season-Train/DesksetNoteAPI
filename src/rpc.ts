export default class RpcServer {
    private _websocket: WebSocket
    private _instance: any

    constructor(
        websocket: WebSocket,
        instance: any
    ) {
        this._instance = instance

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
}
