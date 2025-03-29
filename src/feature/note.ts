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

    // thinoApi: any  // Thino 没有提供 CRUD API
    thinoConf: any

    constructor(app: App) {
        this.app = app

        this.tasksApi = (this.app as any).plugins.plugins['obsidian-tasks-plugin'].apiV1
        this.app.vault.adapter.read('.obsidian/plugins/obsidian-tasks-plugin/data.json')
          .then(conf => this.tasksConf = JSON.parse(conf))

        this.dataviewApi = getAPI(this.app)
        this.app.vault.adapter.read('.obsidian/plugins/dataview/data.json')
          .then(conf => this.dataviewConf = JSON.parse(conf))

        this.app.vault.adapter.read('.obsidian/plugins/obsidian-memos/data.json')
          .then(conf => this.thinoConf = JSON.parse(conf))

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
            // 注：如果 tasks 插件没有提供接口，那么分析任务文本 task.text 中的语义化信息将交给后端，以避免 Obsidian 性能损耗
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

    getAllThinos = async (notepath: string): Promise<any> => {
        const title = this.thinoConf.ProcessEntriesBelow  // Thino 所在标题
        const format = this.thinoConf.DefaultTimePrefix   // Thino 时间前缀 HH:mm 或 HH:mm:ss
        const file = await this.app.vault.adapter.read(notepath)

        // 获取 Thino 所在标题下的文本 titleText
        const titleRegex = new RegExp(`${title}\n([\\s\\S]*?)(?=\n#|\\Z)`)
        const titleMatch = titleRegex.exec(file)
        const titleText = titleMatch != null ? titleMatch[1].trim() : ''

        // 获取 Thino
        let thinos = []

        const thinoRegex = format == 'HH:mm' ? /^- (\d{2}:\d{2}) (.+)$/gm : /^- (\d{2}:\d{2}:\d{2}) (.+)$/gm
        let thinoMatch
        while ((thinoMatch = thinoRegex.exec(titleText)) != null) {
            thinos.push({
                create: thinoMatch[1],
                content: thinoMatch[2]
            })
        }

        return thinos
    }
}
