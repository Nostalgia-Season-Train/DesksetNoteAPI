import { app } from 'src/core/global'


/* ==== 获取所有可用命令 ==== */
export const getAllCommands = async () => {
  return Object.values((app as any).commands.commands).map((item: any) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}


/* ==== 执行命令 ==== */
export const executeCommand = async (id: string) => {
  const command = (app as any).commands.commands[id]
  if (command == undefined)
    throw Error(`Command ${id} not exist`)
  return await command.callback()
}
