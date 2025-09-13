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

    executeCommand = async (id: string) => {
        const command = (this._app as any).commands.commands[id]
        if (command == undefined)
            throw Error(`Command ${id} not exist`)
        return await command.callback()
    }
}
