import { moment } from 'obsidian'
import { dataview } from 'src/core/global'


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
