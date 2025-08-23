// 代码参考：https://github.com/liamcain/obsidian-daily-notes-interface
import { App, moment } from 'obsidian'

const NOTE_EXTENSION = 'md'
const DEFAULT_DIARY_FORMAT = 'YYYY-MM-DD'

export default class Diary {
    private _app: App

    constructor(app: App) {
        this._app = app
    }

    private _getDiarySetting = async (): Promise<{ format: string, folder: string, template: string }> => {
        const { internalPlugins } = this._app as any
        const { format, folder, template } = internalPlugins.getPluginById('daily-notes')?.instance?.options || {}
        return {
            format: format || DEFAULT_DIARY_FORMAT,
            folder: folder || '',
            template: template || ''
        }
    }

    getTodayDiary = async () => {
        const now = moment()
        const { format, folder } = await this._getDiarySetting()
        const path = `${folder}/${now.format(format)}.${NOTE_EXTENSION}`
        return this._app.vault.getFileByPath(path)
    }
}
