// 代码参考：https://github.com/liamcain/obsidian-daily-notes-interface
import { App, moment } from 'obsidian'

const DAYID_FORMAT = 'YYYYMMDD'  // 某天 ID：格式 YYYYMMDD
const MONTHID_FORMAT = 'YYYYMM'  // 某月 ID：格式 YYYYMM
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

    getDiary = async (dayid: string) => {
        const day = moment(dayid, DAYID_FORMAT)
        const { format, folder } = await this._getDiarySetting()
        const path = `${folder}/${day.format(format)}.${NOTE_EXTENSION}`
        return this._app.vault.getFileByPath(path)
    }

    listDiaryInMonth = async (monthid: string) => {
        const month = moment(monthid, MONTHID_FORMAT)

        // 直接生成 dateUID 查找，最多 31 次
        let diarysInMonth = []
        for (let num = 1; num <= moment(month).daysInMonth(); num++) {
            const dayid = moment(month).date(num).format(DAYID_FORMAT)
            const diary = await this.getDiary(dayid)
            if (diary != null) {
                diarysInMonth.push({
                    id: dayid,
                    path: diary.path,
                    content: await this._app.vault.read(diary)
                })
            }
        }

        return diarysInMonth
    }
}
