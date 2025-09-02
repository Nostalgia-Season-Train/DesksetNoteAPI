import { App, moment } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import Window from './feature/window'
import Diary from './feature/diary'
import Task from './feature/task'
import Suggest from './feature/suggest'

type Filter = {
    type: string,         // 比较类型：is、startsWith、endsWith、contains、isEmpty
    isInvert: boolean,    // 是否取反比较结果
    propertyKey: string,  // 要比较的属性
    compareValue: string  // 要比较的值
}
type FilterGroup = {
    match: string,  // 匹配规则：匹配所有 all、匹配任意 any
    filters: Array<Filter | FilterGroup>
}

export default class Unify {
    private _app: App
    private _dataviewApi: DataviewApi

    private _window: Window
    private _task: Task
    private _diary: Diary
    private _suggest: Suggest

    constructor(app: App) {
        this._app = app
        this._dataviewApi = getAPI(this._app)

        if (this._dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }

        this._window = new Window()
        this._task = new Task(this._app)
        this._diary = new Diary(this._app, this._task)
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
        await this._window.fullscreen()
        return null  // rpc 接收不到 void 返回
    }

    open_in_obsidian = async (path: string) => {
        const tfile = this._app.vault.getFileByPath(path)
        if (tfile != null) {
            await this._app.workspace.getLeaf(true).openFile(tfile)
            await this._window.fullscreen()
        }
        return null
    }


    /* ==== 数据分析 ==== */
    private _compare_string = async (type: string, str1: string, str2: string) => {
        switch (type) {
            case 'is':
                return str1 == str2
            case 'startsWith':
                return str1.startsWith(str2)
            case 'endsWith':
                return str1.endsWith(str2)
            case 'contains':
                return str1.contains(str2)
            default:
                return false
        }
    }

    private _compare_number = async (type: string, num1: number, num2: number) => {
        switch (type) {
            case '=':
                return num1 == num2
            case '>':
                return num1 > num2
            case '<':
                return num1 < num2
            case '>=':
                return num1 >= num2
            case '<=':
                return num1 <= num2
            default:
                return false
        }
    }

    private _filter_file = async (file: any, filterGroup: FilterGroup): Promise<boolean> => {
        const { match, filters } = filterGroup

        // 行为明确：filters 若为空数组返回 真
        if (filters.length == 0)
            return true

        const results = await Promise.all(filters.map(async filter => {
            if ((filter as any)?.match == undefined) {
                const { type, isInvert, propertyKey, compareValue } = filter as Filter
                // 行为明确：propertyKey 若为空字符串返回 false
                if (propertyKey == '')
                    return false

                // isInvert != Boolean：取反 Boolean
                const propertyValue = file[propertyKey]
                // null 不同于 undefined，null 是键存在，但没有值（如 prop: ）
                if (propertyValue == undefined || propertyValue == null) {
                    if (type == 'isEmpty')
                        return isInvert != true
                    return isInvert != false
                }

                // 比较数字属性：文件创建时间、修改时间、大小
                if (propertyKey == 'file.ctime' || propertyKey == 'file.mtime' || propertyKey == 'file.size')
                    return isInvert != await this._compare_number(type, propertyValue, Number(compareValue))

                // String(propertyValue)：有时 propertyValue 不是 string 类型
                return isInvert != await this._compare_string(type, String(propertyValue), compareValue)
            } else {
                return await this._filter_file(file, filter as FilterGroup)
            }
        }))

        if (match == 'all')
            return results.every(result => result)
        else
            return results.some(result => result)
    }

    private _preProcessFilterGroup = async (rawFilterGroup: FilterGroup): Promise<FilterGroup> => {
        const { match: rawMatch, filters: rawFilters } = rawFilterGroup

        const filters = await Promise.all(rawFilters.map(async rawFilter => {
            if ((rawFilter as any)?.match == undefined) {
                const {
                    type: rawType,
                    isInvert: rawIsInvert,
                    propertyKey: rawPropertyKey,
                    compareValue: rawCompareValue
                } = rawFilter as Filter

                // toLowerCase() 不区分大小写，需要提前将 file 中的键全部转换成小写
                const propertyKey = rawPropertyKey.toLowerCase()

                return {
                    type: rawType,
                    isInvert: rawIsInvert,
                    propertyKey: propertyKey,
                    compareValue: rawCompareValue
                }
            } else {
                return await this._preProcessFilterGroup(rawFilter as FilterGroup)
            }
        }))

        return { match: rawMatch, filters: filters }
    }

    filter_frontmatter = async (rawFilterGroup: FilterGroup) => {
        let files = []

        // 预处理过滤器组：大小写转换...
        const filterGroup = await this._preProcessFilterGroup(rawFilterGroup)

        // dv.pages('"folder"') 限制范围，方便测试
        for (const page of this._dataviewApi.pages()) {
            // 1、预处理
            const rawFile = page.file
            // 将 frontmatter 中的键（属性名）全部转换成小写
            const frontmatter = Object.fromEntries(Object.entries(rawFile.frontmatter).map(([k, v]) => [k.toLowerCase(), v]))
            const file = {
                ...frontmatter,
                'file.name': rawFile.name,
                'file.basename': rawFile.name,
                'file.ext': rawFile.ext,
                'file.fullname': `${rawFile.name}.${rawFile.ext}`,
                'file.folder': rawFile.folder,
                'file.path': rawFile.path,
                'file.ctime': Number(rawFile.ctime),
                'file.mtime': Number(rawFile.mtime),
                'file.size': rawFile.size,
                'file.aliases': rawFile.aliases.values,
                'file.tags': rawFile.tags.values
            }

            // 2、判断
            if (await this._filter_file(file, filterGroup))
                files.push(file)
        }

        return files
    }

    filter_frontmatter_number = async (filterGroup: FilterGroup) => {
        return (await this.filter_frontmatter(filterGroup)).length
    }
}
