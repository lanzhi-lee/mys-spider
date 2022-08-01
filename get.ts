// 从网络获取解析后的原始数据
import { pick } from 'lodash-es'
import dayjs from 'dayjs'

import { getPlainDataDB } from './utils.js'

// TODO 考虑调整为命令行传入
const UID = '81879993'
const HEADERS = {
  Referer: 'https://bbs.mihoyo.com/',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

const db = getPlainDataDB()
await db.read()

// 清除之前抓取的版本，随后直接以最新版替换
db.data!.records = []

// 写入用户名
const { nickname } = await getUserInfo()
db.data!.nickname = nickname

// 主要抓取代码
let offset = ''
console.log(`开始抓取：${nickname}\n`)
while (true) {
  // 请求接口
  const data = await getPosts(offset)
  console.log('是否结束:', data.is_last, '下一页:', data.next_offset)

  // 写数据库
  console.log('写数据中...')
  db?.data?.records.push(data)
  await db.write()
  console.log('写数据完成...\n')

  // 修改偏移值
  offset = data.next_offset

  // 读到最后一页，跳出读取进程
  if (data.is_last) {
    console.log('全部读取完成...')
    break
  }
}

// 最后修改更新时间
db.data!.lastUpdateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
await db.write()

/********  以下为功能函数及类型定义  ********/

async function getPosts(offset: string) {
  const url = `https://bbs-api.mihoyo.com/post/wapi/userPost?offset=${offset}&size=20&uid=${UID}`

  return fetch(url, { headers: HEADERS, method: 'GET' })
    .then((res) => res.json())
    .then<UserPostRes>((res) => res.data)
    .then((res) => {
      return {
        ...pick(res, 'is_last', 'next_offset'),
        data: res.list.map(({ post, stat }) => ({
          ...pick(post, [
            //
            'post_id',
            'subject',
            'content',
            'cover',
            // 'created_at',
            'images',
          ]),
          // 转换为时间文本
          created_at: dayjs.unix(+post.created_at).format('YYYY-MM-DD HH:mm:ss'),
          ...pick(stat, ['view_num', 'reply_num', 'like_num', 'bookmark_num']),
        })),
      }
    })
}

async function getUserInfo() {
  return fetch(`https://bbs-api.mihoyo.com/user/wapi/getUserFullInfo?gids=2&uid=${UID}`, {
    headers: HEADERS,
    method: 'GET',
  })
    .then((res) => res.json())
    .then<UserInfoRes>((res) => res.data)
    .then((res) => ({ ...pick(res.user_info, ['uid', 'nickname', 'introduce', 'avatar_url']) }))
}

type UserPostRes = {
  list: {
    /** 文章详情 */
    post: {
      // 文章ID
      post_id: string
      /** 标题 */
      subject: string
      /** 正文 */
      content: string
      /** 封面 */
      cover: string
      /** 创建时间 十位时间戳 -> 字符串 */
      created_at: string
      /** 图片列表 */
      images: string[]
    }
    /** 文章状况 */
    stat: {
      /** 浏览量 */
      view_num: number
      /** 回复量 */
      reply_num: number
      /** 点赞量 */
      like_num: number
      /** 收藏量 */
      bookmark_num: number
    }
  }[]
  /** 是否最后一页 */
  is_last: boolean
  /** 下一个偏移值 字符串数字 */
  next_offset: string
}

export type PostType = Awaited<ReturnType<typeof getPosts>>
export type PlainDBType = {
  lastUpdateTime: string
  nickname: string
  records: PostType[]
}

type UserInfoRes = {
  user_info: {
    uid: string
    nickname: string
    introduce: string
    avatar_url: string
  }
}
