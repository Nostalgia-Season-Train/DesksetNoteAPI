import { App } from 'obsidian'

export default class Command {
    private _app: App

    constructor(app: App) {
        this._app = app
    }

    getAllCommands = async () => {
        return Object.values((this._app as any).commands.commands).map((item: any) => {
            return {
                id: item.id,
                name: item.name
            }
        })
    }
}
