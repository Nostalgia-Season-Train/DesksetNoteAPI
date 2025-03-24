import { getAPI } from 'obsidian-dataview'

// 类型注解
import { App } from 'obsidian'
import { DataviewApi } from 'obsidian-dataview'

export default class Note {
    app: App

    tasksApi: any
    tasksConf: object

    dataviewApi: DataviewApi
    dataviewConf: object

    constructor(app: App) {
        this.app = app

        this.tasksApi = (this.app as any).plugins.plugins['obsidian-tasks-plugin'].apiV1
        this.app.vault.adapter.read('.obsidian/plugins/obsidian-tasks-plugin/data.json')
          .then(conf => this.tasksConf = JSON.parse(conf))

        this.dataviewApi = getAPI(this.app)
        this.app.vault.adapter.read('.obsidian/plugins/dataview/data.json')
          .then(conf => this.dataviewConf = JSON.parse(conf))

        if (this.tasksApi == undefined) {
            throw Error('Tasks not enable')
        }
        if (this.dataviewApi == undefined) {
            throw Error('Dataview not enable')
        }
    }

    getAllTasks = async (notepath: string): Promise<any> => {
        let tasksForRep: any = []

        const tasks = this.dataviewApi.page(notepath).file.tasks.values
        for (const task of tasks) {
            tasksForRep.push({
                line: task.line,  // 作为修改用的 ID
                status: task.status,
                text: task.text.endsWith('\n') ? task.text.slice(0, -1) : task.text  // dataview 返回的 task.text 有时存在换行符
            })
        }

        return tasksForRep
    }

    toggleOneTask = async (notepath: string, line: number, status: string, text: string): Promise<boolean> => {
        let fileLines: string[] = (await this.app.vault.adapter.read(notepath)).split('\n')
        let targetTaskStr: string = fileLines[line]

        if (targetTaskStr != `- [${status}] ${text}`) {
            return false
        }

        targetTaskStr = this.tasksApi.executeToggleTaskDoneCommand(targetTaskStr, notepath)
        fileLines[line] = targetTaskStr
        this.app.vault.adapter.write(notepath, fileLines.join('\n'))

        return true
    }
}
