// 代码参考：https://github.com/liamcain/obsidian-daily-notes-interface
import { TFile, moment } from 'obsidian'
import { app } from 'src/core/global'
import { readTFile } from 'src/core/file'
import { getAllTasks } from './_note/task'

const DAY_FORMAT = 'YYYYMMDD'  // 某天：格式 YYYYMMDD
const MONTH_FORMAT = 'YYYYMM'  // 某月：格式 YYYYMM
const NOTE_EXTENSION = 'md'
const DEFAULT_DIARY_FORMAT = 'YYYY-MM-DD'

const _parseDiary = async (id: string, tfile: TFile) => {
  const name = tfile.basename
  const path = tfile.path
  const text = await app.vault.read(tfile)
  const content = text.replace(/^---[\s\S]+?---\n?/, '')
  return {
    id: id,
    name: name,
    path: path,
    text: text,
    content: content,
    tasks: await getAllTasks(path) ?? []
  }
}


/* ==== 获取 日记插件 设置 ==== */
export const getDiarySetting = async (): Promise<{ format: string, folder: string, template: string }> => {
  const { internalPlugins } = app as any
  const { format, folder, template } = internalPlugins.getPluginById('daily-notes')?.instance?.options || {}
  return {
    format: format || DEFAULT_DIARY_FORMAT,
    folder: folder || '',
    template: template || ''
  }
}


/* ==== 获取 某天 日记 ==== */
export const getOneDiary = async (day: string) => {
  const { format, folder } = await getDiarySetting()

  const dayObj = moment(day, DAY_FORMAT)
  const path = `${folder}/${dayObj.format(format)}.${NOTE_EXTENSION}`
  const rawDiary = await readTFile(path)

  return await _parseDiary(dayObj.format(DAY_FORMAT), rawDiary)
}


/* ==== 获取 某月中的所有 日记 ==== */
export const getAllDiarysInOneMonth = async (month: string) => {
  const { format, folder } = await getDiarySetting()
  const monthObj = moment(month, MONTH_FORMAT)

  // 直接生成 dateUID 查找，最多 31 次
  let diarysInMonth = []

  for (let num = 1; num <= moment(monthObj).daysInMonth(); num++) {
    const dayObj = moment(monthObj).date(num)
    const path = `${folder}/${dayObj.format(format)}.${NOTE_EXTENSION}`
    const rawDiary = app.vault.getFileByPath(path)
    if (rawDiary != null) {
      diarysInMonth.push(await _parseDiary(dayObj.format(DAY_FORMAT), rawDiary))
    }
  }

  return diarysInMonth
}
