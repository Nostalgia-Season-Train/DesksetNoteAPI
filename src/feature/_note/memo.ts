import { app } from 'src/core/global'


/* ==== 获取所有便签 ==== */
export const getAllMemos = async (path: string) => {
  const title = '# Memos'    // Memo 所在标题，默认 # Memos
  const format = 'HH:mm:ss'  // Memo 时间前缀，默认 HH:mm:ss
  const file = await app.vault.adapter.read(path)

  // 获取 Memo 所在标题下的文本 titleText
  const titleRegex = new RegExp(`${title}\n([\\s\\S]*?)(?=\n#|$)`)
  const titleMatch = titleRegex.exec(file)
  // titleText 末尾加上换行符，方便下面 \n$ 正则匹配
  const titleText = titleMatch != null ? titleMatch[1].trim() + '\n' : ''

  // 获取 Memo
  let memos = []

  // @ts-ignore ts(2367) const format 比较 'HH:mm' 会报错
  const memoRegex = format == 'HH:mm' ? /^- (\d{2}:\d{2}) ([\s\S]*?)(?=\n-|\n$)/gm : /^- (\d{2}:\d{2}:\d{2}) ([\s\S]*?)(?=\n-|\n$)/gm
  let memoMatch
  while ((memoMatch = memoRegex.exec(titleText)) != null) {
    memos.push({
      create: memoMatch[1].trim(),
      content: memoMatch[2].trim()
    })
  }

  return memos
}
