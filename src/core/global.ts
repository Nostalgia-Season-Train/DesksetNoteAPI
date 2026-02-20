import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'
import { DatacoreApi } from '@blacksmithgu/datacore'

declare global {
  interface Window {
    app: App
    datacore: DatacoreApi
  }
}

export const app = window.app
export const dataview = getAPI(app) as DataviewApi
export const datacore = window.datacore

export const thino = (app as any).plugins.plugins['obsidian-memos'] as Record<string, any> | undefined
export const tasks = (app as any).plugins.plugins['obsidian-tasks-plugin'] as Record<string, any> | undefined

// 本插件的自指，插件加载时传入引用
import { DesksetPluginSetting, NewTaskPosition } from './setting'
import { randomString } from './random'

export const deskset: {
  setting: DesksetPluginSetting
} = {
  setting: {
    host: '127.0.0.1',
    port: 6528,
    username: 'noteapi-user' + randomString(5, 10),
    password: 'noteapi-pswd' + randomString(10, 20),
    task: {
      newTaskPosition: NewTaskPosition.LatestTask
    }
  }
}
