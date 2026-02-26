import { moment } from 'obsidian'
import { app } from 'src/core/global'


/* ==== 仓库热点 ==== */
export const getHeats = async (startDay: string, endDay: string) => {
  const startMoment = moment(startDay, 'YYYYMMDD')
  const endMoment = moment(endDay, 'YYYYMMDD')
  const dayNum = endMoment.diff(startMoment, 'day') + 1

  // 热点 { key: 哪天, value: 行为次数 }
  const heatObj = Object.fromEntries(
    Array.from({ length: dayNum }, (_, n) => [
      startMoment.clone().add(n, 'day').format('YYYYMMDD'),  // 键
      0                                                      // 值
    ])
  )

  for (const file of app.vault.getFiles()) {
    const modifyDay = moment(file.stat.mtime).format('YYYYMMDD')
    if (heatObj.hasOwnProperty(modifyDay)) {
      heatObj[modifyDay]++
    }
  }

  return Object.entries(heatObj).map(([key, value]) => ({ day: key, num: value }))
}
