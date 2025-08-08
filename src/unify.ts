import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

export default class Unify {
    private _app: App
    private _dataviewApi: DataviewApi

    constructor(app: App) {
        this._app = app
        this._dataviewApi = getAPI(this._app)

        if (this._dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }
    }

    // 获取笔记总数
    get_note_number = async (): Promise<number> => {
        return this._dataviewApi.pages().length
    }

    // 获取活跃文件（当前聚焦的标签页）
    get_active_file = async (): Promise<string> => {
        return this._app.workspace.getActiveFile()?.path ?? ''
    }
}
