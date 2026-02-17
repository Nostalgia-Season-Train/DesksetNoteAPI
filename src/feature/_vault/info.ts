import { app, dataview } from 'src/core/global'

const _loopVault = async () => {
  let noteNum = 0
  let attachNum = 0
  const today = (new Date()).setHours(0, 0, 0, 0)  // 今天零点
  let noteTodayNum = 0
  let attachTodayNum = 0

  for (const file of app.vault.getFiles()) {
    if (file.extension === 'md') {
      noteNum++
      if (file.stat.ctime > today)
        noteTodayNum++
    }
    else {
      attachNum++
      if (file.stat.ctime > today)
        attachTodayNum++
    }
  }

  return {
    noteNum: noteNum,
    attachNum: attachNum,
    noteTodayNum: noteTodayNum,
    attachTodayNum: attachTodayNum
  }
}

const _getUsedayNum = async (): Promise<number> => {
  // @ts-ignore
  const oldestNote = dataview.pages().file.sort(file => file.cday)[0]  // 比较 cday 而不是 ctime 节省性能
  // @ts-ignore
  return Math.floor([new Date() - oldestNote.ctime] / (60 * 60 * 24 * 1000))
}


/* ==== 仓库信息 ==== */
export const getVaultInfo = async () => {
  const loopStats = await _loopVault()
  return {
    note_num: loopStats.noteNum,                             // 笔记总数
    attach_num: loopStats.attachNum,                         // 附件总数
    note_today_num: loopStats.noteTodayNum,                  // 今天创建的笔记总数
    attach_today_num: loopStats.attachTodayNum,              // 今天创建的附件总数
    useday_num: await _getUsedayNum(),                       // 使用天数
    tag_num: dataview.pages().file.etags.distinct().length,  // 标签总数
    task_num: dataview.pages().file.tasks.length             // 任务总数
  }
}


/* ==== 获取活跃文件 ==== */
// 活跃文件 = 当前聚焦标签页打开的文件
export const getActiveFile = async () => {
  return app.workspace.getActiveFile()?.path ?? ''
}
