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
import Note from '../feature/note'

export default class Diary {
    router: Router
    app: App

    note: Note

    constructor(app: App, note: Note) {
        this.router = new Router({ prefix: '/diary' })
        this.app = app

        this.note = note

        // 中间件
        this.router.use(this.middleIsDailyNotesEnable)

        // 路由注册
          // 注：有问题加上 bind(this) 例如 this.createToday.bind(this)
        this.router.get('/create-today', this.createToday)
        this.router.get('/read-today', this.readToday)
        this.router.get('/read-day/:day*', this.readDay)
        this.router.get('/read-month/:month*', this.readMonth)
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

        ctx.body = 'create diary success'
    }

    readToday = async (ctx: any, next: any): Promise<void> => {
        try {
            const date = moment()

            const diarys = getAllDailyNotes()
            const todayDiary = getDailyNote(date, diarys)

            if (todayDiary == undefined) {
                ctx.body = undefined
                return
            }

            ctx.body = {
                id: date.format('YYYYMMDD'),
                notepath: todayDiary.path,
                content: await this.app.vault.read(todayDiary)
            }
        } catch (error) {
            ctx.throw(500, error.stack, { expose: true })
        }
    }

    readDay = async (ctx: any, next: any): Promise<void> => {
        const day = ctx.params.day
        const date = moment(day)

        const diarys = getAllDailyNotes()
        const todayDiary = getDailyNote(date, diarys)

        ctx.body = {
            id: day,
            notepath: todayDiary.path,
            content: await this.app.vault.read(todayDiary),
            tasks: await this.note.getAllTasks(todayDiary.path)
        }
    }

    readMonth = async (ctx: any, next: any): Promise<void> => {
        const month = ctx.params.month

        // 直接生成 dateUID 查找，最多 31 次
        const diarys = getAllDailyNotes()
        let diarysInMonth = []
        for (let num = 1; num <= moment(month).daysInMonth(); num++) {
            const day = moment(month).date(num)
            const diary = getDailyNote(day, diarys)
            if (diary != undefined) {
                diarysInMonth.push({
                    id: day.format('YYYYMMDD'),  // 注意这个 day 是 Moment 不是上面那个 string
                    notepath: diary.path,
                    content: await this.app.vault.read(diary),
                    tasks: await this.note.getAllTasks(diary.path)
                })
            }
        }

        ctx.body = diarysInMonth
    }
}
