export enum NewTaskPosition {
  LatestTask = 'latestTask',
  LatestLine = 'latestLine'
}

export interface DesksetPluginSetting {
  host: string
  port: number
  username: string
  password: string
  task: {
    newTaskPosition: NewTaskPosition
  }
}


/* ==== 全局静态配置 ==== */
export const DESKSET_NOTEAPI_VERSION = '0.0.1'
