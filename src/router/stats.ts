import { moment } from 'obsidian'
import { getAPI } from 'obsidian-dataview'

import Router from '@koa/router'

// 类型注解
import { App } from 'obsidian'
import { DataviewApi } from 'obsidian-dataview'

export default class Stats {
    router: Router
    app: App

    dataviewApi: DataviewApi
    dataviewConf: object

    constructor(app: App) {
        this.router = new Router({ prefix: '/stats' })
        this.app = app

        this.dataviewApi = getAPI(this.app)
        this.app.vault.adapter.read('.obsidian/plugins/dataview/data.json')
          .then(conf => this.dataviewConf = JSON.parse(conf))

        if (this.dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }

        this.router.get('/note-number', this.note_number)
        this.router.get('/heatmap/:weeknum', this.heatmap)
        this.router.get('/use-days', this.use_days)
    }

    // 笔记总数
    note_number = async (ctx: any, next: any): Promise<void> => {
        ctx.body = this.dataviewApi.pages().length
    }

    // 热力图：统计本周 + 前 weeknum 周的笔记创建和编辑数量
      // - [ ] 后面优化
    heatmap = async (ctx: any, next: any): Promise<void> => {
        // 前 weeknum 周
        const weeknum = ctx.params.weeknum

        // 起始日期 ~ 结束日期：前 weeknum 周周一 ~ 今天
          // 注：不会统计同一笔记，连续编辑的情况...除非追踪 Git
        const start = Number(moment().subtract(weeknum, 'weeks').startOf('week').format('YYYYMMDD'))
        const end = Number(moment().format('YYYYMMDD'))

        // 所有笔记创建日期和修改日期的数组
        let ctimes: number[] = []
        let mtimes: number[] = []
        this.dataviewApi.pages().map((page: any) => {
            ctimes.push(Number(moment(page.file.ctime.ts).format('YYYYMMDD')))
            mtimes.push(Number(moment(page.file.mtime.ts).format('YYYYMMDD')))
        })

        // 热点 = { 日期, 当日创建和编辑笔记的数量 }
        let heats: Array<{ date: string, number: number }> = []
        for (let date = start; date <= end; date++) {
            const number = ctimes.filter(ctime => ctime == date).length + mtimes.filter(mtime => mtime == date).length
            heats.push({ date: String(date), number: number })
        }

        ctx.body = heats
    }

    // Obsidian 仓库使用天数
      // - [ ] 后面在选项中设置仓库创建日期
    use_days = async (ctx: any, next: any): Promise<void> => {
        const vault_create = '20240921'
        ctx.body = moment().diff(moment(vault_create, 'YYYYMMDD'), 'days')
    }
}
