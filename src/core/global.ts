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
