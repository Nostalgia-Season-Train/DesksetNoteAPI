export interface DesksetPluginSetting {
    host: string
    port: number
    username: string
    password: string
    profile: {
        avatar: string  // 头像
        name: string    // 昵称
        bio: string     // 签名
    }
    greets: {
        id: string  // 标识符 = YYYYMMDDHHmmss(创建日期时间) + 000000(同一时刻生成顺序)
        start: string  // 开始时间，格式 HHmm
        end: string    // 结束时间，格式 HHmm
        open: string     // 开场白（例：早上好）
        content: string  // 问候内容（例：今天也是元气满满的一天！）
    }[]
}
