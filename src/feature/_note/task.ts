import { NewTaskPosition } from 'src/core/setting'
import { app, dataview, tasks, deskset } from 'src/core/global'

const tasksAPI = tasks?.apiV1

const _paraseTask = async (data: string) => {
  const match = data.match(/(^\ *\-\ \[)(.)(\]\ )([\s\S]*)/)
  // null 代表匹配失败，不是任务格式 '- [ ] '
  if (match === null)
    return null

  // 解析示例：- [x] 这是一个任务
    // 任务数据 data   = box.prefix + status + box.suffix + text
    // 任务盒子 box    = { prefix: '- [', suffix: '] ' }
    // 任务状态 status = 'x'
    // 任务文本 text   = '这是一个任务'
    // - [ ] 后面再按 Tasks 文档解析任务文本，从 text 分离内容 content 和标志 sign（Emoji 或 Dataview 记号）
    // 文档：https://publish.obsidian.md/tasks/Reference/Task+Formats/About+Task+Formats
  const box = { prefix: match[1], suffix: match[3] }
  const status = match[2]
  const text = match[4]

  return {
    get data() {
      return `${this.box.prefix}${this.status}${this.box.suffix}${this.text}`
    },
    box: box,
    status: status,
    text: text
  }
}

const _structTask = async (text: string) => {
  const box = { prefix: '- [', suffix: '] ' }
  const status = ' '

  return {
    get data() {
      return `${this.box.prefix}${this.status}${this.box.suffix}${this.text}`
    },
    box: box,
    status: status,
    text: text
  }
}


/* ==== 获取某个文件中的所有任务 ==== */
export const getAllTasks = async (path: string): Promise<{
  line: number
  status: string,
  content: string
}[] | null> => {
  const page = dataview.page(path)
  // 文件不存在返回 null
  if (page == undefined)
    return null

  const tasks = page.file.tasks.values.map((item: any) => {
    return {
      line: item.line,
      status: item.status,
      content: item.text.endsWith('\n') ? item.text.slice(0, -1) : item.text  // dataview 返回的 task.text 有时存在换行符
    }
  })
  return tasks
}


/* ==== 切换某个文件中的某行任务 ==== */
export const toggleTask = async (path: string, line: number) => {
  const fileLines: string[] = (await app.vault.adapter.read(path)).split('\n')
  const targetLine: string = fileLines[line]
  const match = targetLine.match(/^\ *\-\ \[(.)\]\ /)  // ^ 从字符串头开始匹配

  // null 代表匹配失败，不是任务格式 '- [ ] '
  if (match == null)
    return false

  // 任务状态：' ' 未完成，'x' 已完成
  const taskStatus = match[1]

  // 通过 Tasks 社区插件切换任务
  if (tasksAPI != undefined || tasksAPI != null) {
    const newTargetLine = tasksAPI.executeToggleTaskDoneCommand(targetLine, path)
    fileLines[line] = newTargetLine
    app.vault.adapter.write(path, fileLines.join('\n'))
    return true
  }

  // 切换任务
  let newTargetLine
  if (taskStatus == ' ')
    newTargetLine = targetLine.replace(/\[.\]/, '[x]')
  else
    newTargetLine = targetLine.replace(/\[.\]/, '[ ]')
  fileLines[line] = newTargetLine

  await app.vault.adapter.write(path, fileLines.join('\n'))

  // 返回成功
  return true
}


/* ==== 创建任务 ==== */
export const creatTask = async (path: string, content: string) => {
  let fileLines: string[] = (await app.vault.adapter.read(path)).split('\n')

  // 优先创建在文件最后一个任务之后
  if (deskset.setting.task.newTaskPosition === NewTaskPosition.LatestTask) {
    const tasks = await getAllTasks(path)
    if (tasks !== null && tasks.length !== 0) {
      const latestTaskLine = tasks[tasks.length - 1].line
      // latestTaskLine + 1 >= fileLines.length：不用管，插入在数组结尾
      fileLines.splice(latestTaskLine + 1, 0, (await _structTask(content)).data)
      await app.vault.adapter.write(path, fileLines.join('\n'))
      return
    }
  }

  // 末尾是空行
  if (fileLines[fileLines.length - 1] === '') {
    fileLines[fileLines.length - 1] = (await _structTask(content)).data
    fileLines.push('')
  }
  // 末尾不是空行
  else {
    fileLines.push((await _structTask(content)).data)
  }

  await app.vault.adapter.write(path, fileLines.join('\n'))
}


/* ==== 编辑任务（内容） ==== */
export const editTask = async (path: string, line: number, newContent: string) => {
  let fileLines: string[] = (await app.vault.adapter.read(path)).split('\n')

  const taskObj = await _paraseTask(fileLines[line])
  if (taskObj === null)
    return false
  taskObj.text = newContent
  fileLines[line] = taskObj.data

  await app.vault.adapter.write(path, fileLines.join('\n'))
}


/* ==== 删除任务 ==== */
export const deletTask = async (path: string, line: number) => {
  let fileLines: string[] = (await app.vault.adapter.read(path)).split('\n')

  const taskObj = await _paraseTask(fileLines[line])
  if (taskObj === null)
    return false
  fileLines.splice(line, 1)

  await app.vault.adapter.write(path, fileLines.join('\n'))
}
