export enum NewTaskPosition {
  LatestTask = 'latestTask',
  LatestLine = 'latestLine'
}

export interface DesksetPluginSetting {
  host: string
  port: number
  token: string
  task: {
    newTaskPosition: NewTaskPosition
  }
}
