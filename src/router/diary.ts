import { moment } from 'obsidian'
import { createDailyNote } from 'obsidian-daily-notes-interface'

import Router from '@koa/router'

export const routerDiary = new Router({ prefix: '/diary' })

// 创建今日日记
routerDiary.get('/create-today', async (ctx, next) => {
    createDailyNote(moment())
})
