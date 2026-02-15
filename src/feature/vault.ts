import { app, dataview } from 'src/core/global'

const _getNoteNum = async (): Promise<number> => {
  return dataview.pages().length
}

const _getAttachNum = async (): Promise<number> => {
  let num = 0
  for (const file of app.vault.getFiles()) {
    if (file.extension != 'md') num++
  }
  return num
}

const _getUsedayNum = async (): Promise<number> => {
  // @ts-ignore
  const oldestNote = dataview.pages().file.sort(file => file.cday)[0]  // 比较 cday 而不是 ctime 节省性能
  // @ts-ignore
  return Math.floor([new Date() - oldestNote.ctime] / (60 * 60 * 24 * 1000))
}

export const getVaultInfo = async (): Promise<Record<string, number>> => {
  return {
    note_num: await _getNoteNum(),                           // 笔记总数
    attach_num: await _getAttachNum(),                       // 附件总数
    useday_num: await _getUsedayNum(),                       // 使用天数
    tag_num: dataview.pages().file.etags.distinct().length,  // 标签总数
    task_num: dataview.pages().file.tasks.length             // 任务总数
  }
}
