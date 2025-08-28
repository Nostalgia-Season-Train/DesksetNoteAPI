import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

export default class Task {
    private _dataviewApi: DataviewApi

    constructor(app: App) {
        this._dataviewApi = getAPI(app)
    }

    getAllTasks = async (path: string): Promise<{
        line: number
        status: string,
        content: string
    }[] | null> => {
        const page = this._dataviewApi.page(path)
        if (page == undefined)
            return null

        const tasks = page.file.tasks.values.map((item: any) => {
            return {
                line: item.line,
                status: item.status,
                content: item.text.endsWith('\n') ? item.text.slice(0, -1) : item.text  // dataview 返回的 task.text 有时存在换行符
            }
        })
        return tasks
    }
}
