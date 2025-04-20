/* 随机字符串：范围 0~9 + a~z + A~Z */
export const randomString = (min: number, max: number) => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

    if (max < min || min < 0 || max < 0) {
        throw Error('ensure max > min and both > 0')
    }
    const length = Math.floor(Math.random() * (max - min + 1)) + min  // random 范围 [0, 1)，+ 1 确保 floor[0, 2) = 0, 1

    let result = ''
    for (let n = 0; n < length; n++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}
