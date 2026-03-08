// 代码参考：https://github.com/liamcain/obsidian-daily-notes-interface
import { TFile, moment } from 'obsidian'
import { app } from 'src/core/global'
import { DesksetError } from 'src/core/error'
import { readTFile } from 'src/core/file'
import { listTasks } from './_note/task'

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
    tasks: await listTasks(path) ?? []
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


/* ==== 创建 某天 日记 ==== */
export const createDiary = async (day: string) => {
  const { format: setFormat, folder: setFolder, template: setTemplate } = await getDiarySetting()

  const dayObj = moment(day, DAY_FORMAT)
  const path = `${setFolder}/${dayObj.format(setFormat)}.${NOTE_EXTENSION}`
  const name = dayObj.format(setFormat)               // 日记名称（主名不包括后缀）
  const dir = path.split('/').slice(0, -1).join('/')  // 日记目录，比如 path = YYYY/MM/DD.md 那么 dir = YYYY/MM

  // 创建目录
  if (!app.vault.getAbstractFileByPath(dir)) {
    await window.app.vault.createFolder(dir)
  }

  // 创建日记
  const templateTFile = app.vault.getFileByPath(`${setTemplate}.${NOTE_EXTENSION}`)
  const templateText = templateTFile !== null ? await app.vault.cachedRead(templateTFile) : ''

  // 代码来源：https://github.com/liamcain/obsidian-daily-notes-interface/blob/main/src/daily.ts#L28
  try {
    await app.vault.create(
      path,
      templateText
        .replace(/{{\s*date\s*}}/gi, name)
        .replace(/{{\s*time\s*}}/gi, moment().format('HH:mm'))
        .replace(/{{\s*title\s*}}/gi, name)
        .replace(
          /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
          (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = moment()
            const currentDate = dayObj.clone().set({
              hour: now.get('hour'),
              minute: now.get('minute'),
              second: now.get('second')
            })
            if (calc) {
              currentDate.add(parseInt(timeDelta, 10), unit)
            }
            if (momentFormat) {
              return currentDate.format(momentFormat.substring(1).trim())
            }
            return currentDate.format(setFormat)
          }
        )
        .replace(
          /{{\s*yesterday\s*}}/gi,
          dayObj.clone().subtract(1, 'day').format(setFormat)
        )
        .replace(
          /{{\s*tomorrow\s*}}/gi,
          dayObj.clone().add(1, 'd').format(setFormat)
        )
    )
    return true  // Obsidian 创建文件，要等 100ms 左右建立缓存后才能读取
  } catch (err) {
    throw new DesksetError(`Failed to create file: '${path}'.\nReason: ${err?.message}`)
  }
}


/* ==== 写入 某天 日记 ==== */
export const writeDiary = async (day: string, newData: string) => {
  const { format, folder } = await getDiarySetting()

  const dayObj = moment(day, DAY_FORMAT)
  const path = `${folder}/${dayObj.format(format)}.${NOTE_EXTENSION}`
  const rawDiary = await readTFile(path)
  await app.vault.adapter.write(rawDiary.path, newData)  // - [ ] 后面统一到 src/core/file 里

  return true  // 原因同上
}


/* ==== 删除 某天 日记 ==== */
export const deleteDiary = async (day: string) => {
  const { format, folder } = await getDiarySetting()

  const dayObj = moment(day, DAY_FORMAT)
  const path = `${folder}/${dayObj.format(format)}.${NOTE_EXTENSION}`
  const rawDiary = await readTFile(path)
  await app.vault.trash(rawDiary, true)  // - [ ] 后面统一到 src/core/file 里

  return true  // 原因同上
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
