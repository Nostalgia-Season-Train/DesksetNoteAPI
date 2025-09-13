import { moment } from 'obsidian'
import { getAPI } from 'obsidian-dataview'

import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'

// 类型注解
import { App } from 'obsidian'
import { DataviewApi } from 'obsidian-dataview'

export default class Tasks {
    router: Router
    app: App
    tasksApi: any
    tasksConf: any
    dataviewApi: DataviewApi

    constructor(app: App) {
        this.router = new Router({ prefix: '/tasks' })
        this.app = app

        // 获取 tasks 接口 API、配置 Conf
        this.tasksApi = (this.app as any).plugins.plugins['obsidian-tasks-plugin'].apiV1
        this.app.vault.adapter.read('.obsidian/plugins/obsidian-tasks-plugin/data.json')
          .then(conf => this.tasksConf = JSON.parse(conf))
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
        this.router.post('/toggle-task', this.toggleTask)
        this.router.post('/add-task', this.AddTask)
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
                text: task.text.endsWith('\n') ? task.text.slice(0, -1) : task.text  // dataview 返回的 task.text 有时存在换行符
            })
        }

        ctx.body = tasksForRep
    }

    toggleTask = async (ctx: any, next: any): Promise<void> => {
        const notepath = ctx.request.body.notepath
        const line =  ctx.request.body.line
        // status 和 text 确保是目标任务
        const status = ctx.request.body.status
        const text = ctx.request.body.text

        let fileLines: string[] = (await this.app.vault.adapter.read(notepath)).split('\n')
        let targetTaskStr: string = fileLines[line]
        if (targetTaskStr == `- [${status}] ${text}`) {
            targetTaskStr = this.tasksApi.executeToggleTaskDoneCommand(targetTaskStr, notepath)
            fileLines[line] = targetTaskStr
            await this.app.vault.adapter.write(notepath, fileLines.join('\n'))
            ctx.body = 'task toggle complete'
        } else {
            ctx.body = `line ${line} task is ${targetTaskStr}`
        }
    }

    AddTask = async (ctx: any, next: any): Promise<void> => {
        // 在 notepath 下，新增 - [status] text 任务
        const notepath = ctx.request.body.notepath
        const status = ctx.request.body.status
        const text = ctx.request.body.text

        // 是否添加创建日期
        const isSetCreatedDate = this.tasksConf.setCreatedDate
        const createdEmoji = '➕'  // 参考：https://publish.obsidian.md/tasks/Reference/Task+Formats/Tasks+Emoji+Format
        const createdDate = moment().format('YYYY-MM-DD')

        // 直接在笔记行尾加入 task（暂时）
        let file = await this.app.vault.adapter.read(notepath)
        if (isSetCreatedDate) {
            file += `- [${status}] ${text} ${createdEmoji} ${createdDate}\n`
        } else {
            file += `- [${status}] ${text}\n`
        }
        this.app.vault.adapter.write(notepath, file)
    }
}
