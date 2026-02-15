import { app, dataview } from 'src/core/global'


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
export const toggleTask = async (path: string, line: number): Promise<boolean> => {
  const fileLines: string[] = (await app.vault.adapter.read(path)).split('\n')
  const targetLine: string = fileLines[line]
  const match = targetLine.match(/^\ *\-\ \[(.)\]\ /)  // ^ 从字符串头开始匹配

  // null 代表匹配失败，不是任务格式 '- [ ] '
  if (match == null)
    return false

  // 任务状态：' ' 未完成，'x' 已完成
  const taskStatus = match[1]

  // 切换任务
  let newTargetLine
  if (taskStatus == ' ')
    newTargetLine = targetLine.replace(/\[.\]/, '[x]')
  else
    newTargetLine = targetLine.replace(/\[.\]/, '[ ]')
  fileLines[line] = newTargetLine

  app.vault.adapter.write(path, fileLines.join('\n'))

  // 返回成功
  return true
}
