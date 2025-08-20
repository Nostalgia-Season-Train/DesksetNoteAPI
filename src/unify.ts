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

    // 获取附件总数
    get_attachment_number = async (): Promise<number> => {
        let num = 0
        for (const file of this._app.vault.getFiles()) {
            if (file.extension != 'md') num++
        }
        return num
    }

    // 获取仓库使用天数
    get_useday_number = async (): Promise<number> => {
        // @ts-ignore
        const oldestNote = this._dataviewApi.pages().file.sort(file => file.cday)[0]  // 比较 cday 而不是 ctime 节省性能
        // @ts-ignore
        return Math.floor([new Date() - oldestNote.ctime] / (60 * 60 * 24 * 1000))
    }

    // 获取活跃文件（当前聚焦的标签页）
    get_active_file = async (): Promise<string> => {
        return this._app.workspace.getActiveFile()?.path ?? ''
    }
}
