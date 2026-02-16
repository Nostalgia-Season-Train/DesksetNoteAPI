import { App, moment } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import { openObsidian, openObsidianFile } from '../feature/window'
import Diary from '../feature/diary'
import Suggest from '../feature/suggest'
import { FilterGroup, statsFile } from 'src/feature/_note/filter'
import { getVaultInfo, getHeats } from 'src/feature/vault'

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

    get_heatmap = getHeats

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

    /* --- Obsidian 窗口 --- */
    open_vault = openObsidian
    open_in_obsidian = openObsidianFile

    /* --- 数据分析 --- */
    filter_frontmatter = statsFile

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
