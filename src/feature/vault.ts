import { moment } from 'obsidian'
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


/* ==== 仓库信息 ==== */
export const getVaultInfo = async () => {
  return {
    note_num: await _getNoteNum(),                           // 笔记总数
    attach_num: await _getAttachNum(),                       // 附件总数
    useday_num: await _getUsedayNum(),                       // 使用天数
    tag_num: dataview.pages().file.etags.distinct().length,  // 标签总数
    task_num: dataview.pages().file.tasks.length             // 任务总数
  }
}


/* ==== 仓库热点 ==== */
// 热点：统计本周 + 前 weeknum 周的笔记编辑数量
export const getHeats = async (weeknum: number) => {
  // 起始日期 ~ 结束日期：前 weeknum 周周一 ~ 今天
  // 注：不会统计同一笔记，连续编辑的情况...除非追踪 Git
  const start = Number(moment().subtract(weeknum, 'weeks').startOf('week').format('YYYYMMDD'))
  const end = Number(moment().format('YYYYMMDD'))

  // 所有笔记创建日期和修改日期的数组
  // - [ ] 不需要格式转换，后面优化
  let ctimes: number[] = []
  let mtimes: number[] = []
  dataview.pages().map((page: any) => {
    ctimes.push(Number(moment(page.file.ctime.ts).format('YYYYMMDD')))
    mtimes.push(Number(moment(page.file.mtime.ts).format('YYYYMMDD')))
  })

  // 热点 = { 日期, 当日编辑笔记的数量 }
  let heats: Array<{ date: string, number: number }> = []

  for (let date = start; date <= end; date = Number(moment(date, 'YYYYMMDD').add(1, 'days').format('YYYYMMDD'))) {
    const number = mtimes.filter(mtime => mtime == date).length
    heats.push({ date: String(date), number: number })
  }

  return heats
}
