import { getAPI } from 'obsidian-dataview'

import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'

import { App } from 'obsidian'
import { DataviewApi } from 'obsidian-dataview'

export default class Tasks {
    router: Router
    app: App
    tasksApi: any
    dataviewApi: DataviewApi

    constructor(app: App) {
        this.router = new Router({ prefix: '/tasks' })
        this.app = app

        this.tasksApi = (this.app as any).plugins.plugins['obsidian-tasks-plugin'].apiV1
        this.dataviewApi = getAPI(app)

        if (this.tasksApi == undefined) {
            throw Error('Tasks not enable')
        }
        if (this.dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }

        // 中间件：避免运行时关闭
        this.router.use(this.middleIsTasksEnable)

        // 路由注册
        this.router.use(bodyParser())  // post body 解析
        this.router.post('/toggle-tasks', this.toggleTasks)
        this.router.post('/get-all-tasks', this.getAllTasks)
    }

    middleIsTasksEnable = async (ctx: any, next: any): Promise<void> => {
        const plugins = (this.app as any).plugins.plugins
        const tasksPlugin = plugins['obsidian-tasks-plugin']
        const dataviewPlugin = plugins['dataview']
        if (tasksPlugin == undefined || tasksPlugin._userDisabled == true) {
            ctx.throw(500, 'Tasks not enable', { expose: true })
        }
        if (dataviewPlugin == undefined || dataviewPlugin._userDisabled == true) {
            ctx.throw(500, 'Dataview not enable', { expose: true })
        }

        await next()
    }

    toggleTasks = async (ctx: any, next: any): Promise<void> => {
        const notepath = ctx.request.body.notepath  // 暂时不验证

        const tasks = this.dataviewApi.page(notepath).file.tasks.values
        for (const task of tasks) {
            const taskStr = `- [${task.status}] ${task.text}`
            const taskStrAfterToggle = this.tasksApi.executeToggleTaskDoneCommand(taskStr, notepath)
            console.log(taskStrAfterToggle)
        }
    }

    getAllTasks = async (ctx: any, next: any): Promise<void> => {
        const notepath = ctx.request.body.notepath

        let tasksForRep: any = []

        const tasks = this.dataviewApi.page(notepath).file.tasks.values
        for (const task of tasks) {
            tasksForRep.push({
                line: task.line,  // 作为修改用的 ID
                status: task.status,
                text: task.text
            })
        }

        ctx.body = tasksForRep
    }
}
