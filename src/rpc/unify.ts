import { App, moment } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import { openObsidian, openObsidianFile } from '../feature/window'
import Diary from '../feature/diary'
import Suggest from '../feature/suggest'
import { FilterGroup, statsFile } from 'src/feature/_note/filter'
import { getVaultInfo } from 'src/feature/vault'

export default class Unify {
    private _app: App
    private _dataviewApi: DataviewApi

    private _diary: Diary
    private _suggest: Suggest

    constructor(app: App) {
        this._app = app
        this._dataviewApi = getAPI(this._app)

        if (this._dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }

        this._diary = new Diary(this._app)
        this._suggest = new Suggest(this._app)
    }

    // 获取仓库状态
    get_vault_status = async (): Promise<Record<string, number>> => {
        return await getVaultInfo()
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


    /* ==== 日记 ==== */
    read_today_diary = async () => {
        return await this._diary.getTodayDiary()
    }

    read_diary = async (dayid: string) => {
        return await this._diary.getDiary(dayid)
    }

    list_diarys_in_a_month = async (monthid: string) => {
        return await this._diary.listDiaryInMonth(monthid)
    }


    /* ==== Obsidian 窗口 ==== */
    open_vault = async () => {
        return await openObsidian()
    }

    open_in_obsidian = async (path: string) => {
        return await openObsidianFile(path)
    }


    /* ==== 数据分析 ==== */
    filter_frontmatter = async (rawFilterGroup: FilterGroup) => {
        return await statsFile(rawFilterGroup)
    }

    filter_frontmatter_number = async (filterGroup: FilterGroup) => {
        return (await this.filter_frontmatter(filterGroup)).length
    }

    filter_and_random_open_in_obsidian = async (filterGroup: FilterGroup) => {
        const files = await this.filter_frontmatter(filterGroup)
        if (files.length == 0)
            return false
        return await this.open_in_obsidian(files[Math.floor(Math.random() * files.length)]['file.path'])
    }
}
