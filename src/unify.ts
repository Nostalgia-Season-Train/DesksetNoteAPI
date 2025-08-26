import { App, moment } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import Suggest from './feature/suggest'

export default class Unify {
    private _app: App
    private _dataviewApi: DataviewApi

    private _suggest: Suggest

    constructor(app: App) {
        this._app = app
        this._dataviewApi = getAPI(this._app)

        if (this._dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }

        this._suggest = new Suggest(this._app)
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

    // 获取热力图：统计本周 + 前 weeknum 周的笔记创建和编辑数量
    get_heatmap = async (weeknum: number): Promise<{ date: string, number: number }[]> => {
        // 起始日期 ~ 结束日期：前 weeknum 周周一 ~ 今天
          // 注：不会统计同一笔记，连续编辑的情况...除非追踪 Git
        const start = Number(moment().subtract(weeknum, 'weeks').startOf('week').format('YYYYMMDD'))
        const end = Number(moment().format('YYYYMMDD'))

        // 所有笔记创建日期和修改日期的数组
        let ctimes: number[] = []
        let mtimes: number[] = []
        this._dataviewApi.pages().map((page: any) => {
            ctimes.push(Number(moment(page.file.ctime.ts).format('YYYYMMDD')))
            mtimes.push(Number(moment(page.file.mtime.ts).format('YYYYMMDD')))
        })

        // 热点 = { 日期, 当日创建和编辑笔记的数量 }
        let heats: Array<{ date: string, number: number }> = []

        for (let date = start; date <= end; date = Number(moment(date, 'YYYYMMDD').add(1, 'days').format('YYYYMMDD'))) {
            const number = ctimes.filter(ctime => ctime == date).length + mtimes.filter(mtime => mtime == date).length
            heats.push({ date: String(date), number: number })
        }

        return heats
    }

    // 获取活跃文件（当前聚焦的标签页）
    get_active_file = async (): Promise<string> => {
        return this._app.workspace.getActiveFile()?.path ?? ''
    }

    // 返回查询建议，数据来源：核心插件/快速切换
    suggest_by_switcher = async (query: string) => {
        return (await this._suggest.getSuggestions(query)).map(item => {
            if (item?.type != 'file')
                return null
            if (item?.file?.basename == undefined || item?.file?.extension == undefined || item?.file?.path == undefined)
                return null
            return {
                name: item.file.basename,
                type: item.file.extension,
                path: item.file.path
            }
        }).filter(item => item != null)
    }
}
