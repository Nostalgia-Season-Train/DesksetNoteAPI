import { moment } from 'obsidian'
import {
    appHasDailyNotesPluginLoaded,
    createDailyNote,
    getAllDailyNotes,
    getDailyNote
} from 'obsidian-daily-notes-interface'

import Router from '@koa/router'

// 仅用来类型注解
import { App } from 'obsidian'

export default class Diary {
    router: Router
    app: App

    constructor(app: App) {
        this.router = new Router({ prefix: '/diary' })
        this.app = app

        // 中间件
        this.router.use(this.middleIsDailyNotesEnable)

        // 路由注册
          // 注：有问题加上 bind(this) 例如 this.createToday.bind(this)
        this.router.get('/create-today', this.createToday)
        this.router.get('/read-today', this.readToday)
        this.router.get('/read/:id*', this.read)
        this.router.get('/list-month/:month*', this.listMonth)
    }

    middleIsDailyNotesEnable = async (ctx: any, next: any): Promise<void> => {
        if (!appHasDailyNotesPluginLoaded()) {
            ctx.throw(500, 'DailyNotesPlugin not enable', { expose: true })
        }
        await next()
    }

    createToday = async (ctx: any, next: any): Promise<void> => {
        const date = moment()

        // 手动检查，createDailyNote 不会抛出错误
        const diarys = getAllDailyNotes()
        const todayDiary = getDailyNote(date, diarys)
        if (todayDiary != null) {
            ctx.throw(500, 'DailyNote Today already exist', { expose: true })
        }

        createDailyNote(moment())
    }

    readToday = async (ctx: any, next: any): Promise<void> => {
        try {
            const date = moment()

            const diarys = getAllDailyNotes()
            const todayDiary = getDailyNote(date, diarys)

            ctx.body = {
                id: date.format('YYYYMMDD'),
                notepath: todayDiary.path,
                content: await this.app.vault.read(todayDiary)
            }
        } catch (error) {
            ctx.throw(500, error.stack, { expose: true })
        }
    }

    read = async (ctx: any, next: any): Promise<void> => {
        const id = ctx.params.id
        const date = moment(id)

        const diarys = getAllDailyNotes()
        const todayDiary = getDailyNote(date, diarys)

        ctx.body = {
            id: id,
            notepath: todayDiary.path,
            content: await this.app.vault.read(todayDiary)
        }
    }

    listMonth = async (ctx: any, next: any): Promise<void> => {
        const month = ctx.params.month

        // 直接生成 dateUID 查找，最多 31 次
        const diarys = getAllDailyNotes()
        let diarysInMonth = []
        for (let num = 1; num <= moment(month).daysInMonth(); num++) {
            const day = moment(month).date(num)
            const diary = getDailyNote(day, diarys)
            if (diary != undefined) {
                diarysInMonth.push({ id: day, notepath: diary.path })
            }
        }

        ctx.body = diarysInMonth
    }
}
