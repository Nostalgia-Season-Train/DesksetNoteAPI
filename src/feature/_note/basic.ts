import { app, dataview } from 'src/core/global'
import { FileNotExistError, FileAlreadyExistError } from 'src/core/error'


/* ==== 列出仓库子目录下所有笔记路径 ==== */
export const listNotepaths = async (directory: string): Promise<string[]> => {
  const abstractFiles = app.vault.getFiles()
  const filePaths: string[] = []

  for (const file of abstractFiles) {
    if (file.path.startsWith(directory)) {
      filePaths.push(file.path)
    }
  }

  return filePaths
}


/* ==== 创建笔记 ==== */
export const createNote = async (path: string, content: string = '') => {
  if (app.vault.getFileByPath(path) !== null)
    throw new FileAlreadyExistError(path)

  await app.vault.create(path, content)
  return true
}


/* ==== 读取笔记 ==== */
export const readNote = async (path: string): Promise<string> => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)

  return await app.vault.read(tfile)
}


/* ==== 插入笔记 ==== */
export const insertNote = async (path: string, line: number | null, insertData: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)

  const fileContent = await app.vault.read(tfile)
  const fileLines = fileContent.split('\n')

  if (line !== null) {
    fileLines.splice(line, 0, insertData)
  } else {
    if (fileLines[fileLines.length - 1] === '') {
      fileLines[fileLines.length - 1] = insertData
      fileLines.push('')
    } else {
      fileLines.push(insertData)
    }
  }

  await app.vault.modify(tfile, fileLines.join('\n'))
  return true
}


/* ==== 读取笔记属性 ==== */
export const readNoteprop = async (path: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)

  const rawFileCache = app.metadataCache.getFileCache(tfile)
  let frontmatter: Record<string, any> = {}
  let tags: string[] = []
  let tasks: { line: number, status: string, text: string }[] = []

  if (rawFileCache !== null) {
    if (rawFileCache.frontmatter !== undefined) {
      frontmatter = Object.fromEntries(Object.entries(rawFileCache.frontmatter).map(([k, v]) => [k.toLowerCase(), v]))
    }
    if (rawFileCache.tags !== undefined) {
      tags = rawFileCache.tags.map(tag => tag.tag)
    }
    if (rawFileCache.listItems !== undefined) {
      const rawFileData = await app.vault.cachedRead(tfile)
      for (const listItem of rawFileCache.listItems) {
        if (listItem.task === undefined)
          continue
        const taskData = rawFileData.substring(listItem.position.start.offset, listItem.position.end.offset)
        const taskDataMatch = taskData.match(/^\ *\-\ \[(.)\]\ ([\s\S]*)/)
        if (taskDataMatch === null)
          continue
        const taskLine = listItem.position.start.line
        const taskStatus = taskDataMatch[1]
        const taskText = taskDataMatch[2]
        tasks.push({ line: taskLine, status: taskStatus, text: taskText })
      }
    }
  }

  return {
    ...frontmatter,
    'file.basename': tfile.basename,
    'file.extension': tfile.extension,
    'file.fullname': `${tfile.basename}.${tfile.extension}`,
    'file.folder': tfile.parent?.name ?? '',
    'file.path': tfile.path,
    'file.ctime': tfile.stat.ctime,
    'file.mtime': tfile.stat.mtime,
    'file.size': tfile.stat.size,
    'file.tags': tags,
    'file.tasks': tasks,
    'file.inlinks': dataview.page(tfile.path).file.inlinks.values.map((link: any) => { return { display: link.display, path: link.path } }),
    'file.outlinks': dataview.page(tfile.path).file.outlinks.values.map((link: any) => { return { display: link.display, path: link.path } })
  }
}
