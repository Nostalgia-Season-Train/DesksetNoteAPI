import { app } from 'src/core/global'


/* ==== 过滤 ==== */

/* --- 过滤器 --- */
export type Filter = {
  type: string,         // 比较类型：is、startsWith、endsWith、contains、isEmpty
  isInvert: boolean,    // 是否取反比较结果
  propertyKey: string,  // 要比较的属性
  // DesksetBack 传入的 compareValue 全为 string 类型，经过 preProcessFilterGroup 转换成 string | number
  compareValue: string | number  // 要比较的值
}

/* --- 过滤器组 --- */
export type FilterGroup = {
  match: string,  // 匹配规则：匹配所有 all、匹配任意 any
  filters: Array<Filter | FilterGroup>
}


/* ==== 属性比较 ==== */

/* --- 比较字符串 --- */
const _compareString = async (type: string, str1: string, str2: string) => {
  switch (type) {
    case 'is':
      return str1 == str2
    case 'startsWith':
      return str1.startsWith(str2)
    case 'endsWith':
      return str1.endsWith(str2)
    case 'contains':
      return str1.contains(str2)
    default:
      return false
  }
}

/* --- 比较数字 --- */
const _compareNumber = async (type: string, num1: number, num2: number) => {
  switch (type) {
    case '=':
      return num1 == num2
    case '>':
      return num1 > num2
    case '<':
      return num1 < num2
    case '>=':
      return num1 >= num2
    case '<=':
      return num1 <= num2
    default:
      return false
  }
}


/* ==== 文件统计 ==== */

/* --- 过滤文件 --- */
// 按照 filterGroup 比较单个文件 file 的多个属性
// 返回 true 代表想要的文件
const _filterFile = async (file: any, filterGroup: FilterGroup): Promise<boolean> => {
  const { match, filters } = filterGroup

  // 行为明确：filters 若为空数组返回 真
  if (filters.length == 0)
    return true

  const results = await Promise.all(filters.map(async filter => {
    if ((filter as any)?.match == undefined) {
      const { type, isInvert, propertyKey, compareValue } = filter as Filter
      // 行为明确：propertyKey 若为空字符串返回 false
      if (propertyKey == '')
        return false

      // isInvert != Boolean：取反 Boolean
      const propertyValue = file[propertyKey]
      // null 不同于 undefined，null 是键存在，但没有值（如 prop: ）
      if (propertyValue == undefined || propertyValue == null) {
        if (type == 'isEmpty')
          return isInvert != true
        return isInvert != false
      }

      // 比较数字属性：文件创建时间、修改时间、大小
      if (propertyKey == 'file.ctime' || propertyKey == 'file.mtime' || propertyKey == 'file.size') {
        if (typeof compareValue != 'number')
          return false
        return isInvert != await _compareNumber(type, propertyValue, compareValue)
      }
      // 比较字符串属性
      else {
        if (typeof compareValue != 'string')
          return false
        // String(propertyValue)：有时 propertyValue 不是 string 类型
        return isInvert != await _compareString(type, String(propertyValue), compareValue)
      }
    } else {
      return await _filterFile(file, filter as FilterGroup)
    }
  }))

  if (match == 'all')
    return results.every(result => result)
  else
    return results.some(result => result)
}

/* --- 预处理 filterGroup（验证和转换） --- */
const _preprocessFilterGroup = async (rawFilterGroup: FilterGroup): Promise<FilterGroup> => {
  const { match: rawMatch, filters: rawFilters } = rawFilterGroup

  const filters = await Promise.all(rawFilters.map(async rawFilter => {
    if ((rawFilter as any)?.match == undefined) {
      const {
        type: rawType,
        isInvert: rawIsInvert,
        propertyKey: rawPropertyKey,
        compareValue: rawCompareValue
      } = rawFilter as Filter

      // toLowerCase() 不区分大小写，需要提前将 file 中的键全部转换成小写
      const propertyKey = rawPropertyKey.toLowerCase()

      // 将 compareValue 按照 propertyKey 转换成正确的类型
      let compareValue
      if (propertyKey == 'file.ctime' || propertyKey == 'file.mtime' || propertyKey == 'file.size')
        compareValue = Number(rawCompareValue)
      else
        compareValue = String(rawCompareValue)

      return {
        type: rawType,
        isInvert: rawIsInvert,
        propertyKey: propertyKey,
        compareValue: compareValue
      }
    } else {
      return await _preprocessFilterGroup(rawFilter as FilterGroup)
    }
  }))

  return { match: rawMatch, filters: filters }
}

/* --- 文件统计器 --- */
export const statsFile = async (rawFilterGroup: FilterGroup) => {
  let files = []

  // 预处理过滤器组：大小写转换...
  const filterGroup = await _preprocessFilterGroup(rawFilterGroup)

  // dv.pages('"folder"') 限制范围，方便测试
  for (const tfile of app.vault.getFiles()) {
    // 1、预处理文件列表
    const rawFile = tfile
    const rawFileCache = app.metadataCache.getFileCache(rawFile)
    let frontmatter: Record<string, any> = {}  // 文件前言
    let tags: string[] = []                    // 文件标签
    let tasks: { line: number, status: string, text: string }[] = []  // 文件任务
    if (rawFileCache !== null) {
      if (rawFileCache.frontmatter !== undefined) {
        // 将 frontmatter 中的键（属性名）全部转换成小写
        frontmatter = Object.fromEntries(Object.entries(rawFileCache.frontmatter).map(([k, v]) => [k.toLowerCase(), v]))
      }
      if (rawFileCache.tags !== undefined) {
        tags = rawFileCache.tags.map(tag => tag.tag)
      }
      if (rawFileCache.listItems !== undefined) {
        const rawFileData = await app.vault.cachedRead(rawFile)
        for (const listItem of rawFileCache.listItems) {
          if (listItem.task === undefined)
            continue
          // ...Dataview 也用正则匹配 taskText 任务文本
            // 代码：export const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu;
            // 来源：https://github.com/blacksmithgu/obsidian-dataview/blob/master/src/data-import/markdown-file.ts#L183
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
    // 不要参考 Obsidian 数据库筛选命名...过于混乱，file.name 是 tfile.basename，file.fullname 才是 tfile.name
    const file = {
      ...frontmatter,
      // 'file.name'  // 暂定
      'file.basename': rawFile.basename,
      'file.extension': rawFile.extension,
      'file.fullname': `${rawFile.basename}.${rawFile.extension}`,
      'file.folder': rawFile.parent?.name ?? '',  // 明确空字符串语义：文件在仓库根文件夹
      'file.path': rawFile.path,
      'file.ctime': rawFile.stat.ctime,
      'file.mtime': rawFile.stat.mtime,
      'file.size': rawFile.stat.size,
      'file.tags': tags,
      'file.tasks': tasks
    }

    // 2、判断
    if (await _filterFile(file, filterGroup))
      files.push(file)
  }

  return files
}
