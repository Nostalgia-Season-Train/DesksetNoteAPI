import { dataview } from "src/core/global"


/* ==== 获取某个文件中的所有任务 ==== */
  // 文件不存在返回 null
export const getAllTasks = async (path: string): Promise<{
  line: number
  status: string,
  content: string
}[] | null> => {
  const page = dataview.page(path)
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
