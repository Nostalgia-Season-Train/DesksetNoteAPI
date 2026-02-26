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
