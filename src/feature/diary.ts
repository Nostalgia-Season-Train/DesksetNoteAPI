// 代码参考：https://github.com/liamcain/obsidian-daily-notes-interface
import { TFile, moment } from 'obsidian'
import { app } from 'src/core/global'
import { getAllTasks } from './_note/task'

const DAYID_FORMAT = 'YYYYMMDD'  // 某天 ID：格式 YYYYMMDD
const MONTHID_FORMAT = 'YYYYMM'  // 某月 ID：格式 YYYYMM
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
export const getOneDiary = async (dayid: string) => {
  const day = moment(dayid, DAYID_FORMAT)
  const { format, folder } = await getDiarySetting()
  const path = `${folder}/${day.format(format)}.${NOTE_EXTENSION}`
  const diary = app.vault.getFileByPath(path)
  return diary != null ? await _parseDiary(day.format(DAYID_FORMAT), diary) : null
}


/* ==== 获取 某月中的所有 日记 ==== */
export const getAllDiarysInOneMonth = async (monthid: string) => {
  const month = moment(monthid, MONTHID_FORMAT)

  // 直接生成 dateUID 查找，最多 31 次
  let diarysInMonth = []
  for (let num = 1; num <= moment(month).daysInMonth(); num++) {
    const dayid = moment(month).date(num).format(DAYID_FORMAT)
    const diary = await getOneDiary(dayid)
    if (diary != null) {
      diarysInMonth.push(diary)
    }
  }

  return diarysInMonth
}
