// 从本地数据解析页面展示核心的数据

import type { PlainDBType, PostType } from './get.js'

import { getPlainDataDB, getParsedDataDB } from './utils.js'

type ArrayItemType<T extends unknown[]> = T extends (infer R)[] ? R : never

type PostItemType = ArrayItemType<PostType['data']>
type ParsedPostType = (PostItemType & {
  article: string
})[]

export type ParsedDBType = Pick<PlainDBType, 'lastUpdateTime' | 'nickname'> & {
  ysg: (PostItemType & {
    index: string
  })[]
  ysg_avatar: ParsedPostType
  ysg_video: ParsedPostType
  ysg_other: ParsedPostType
}

const YING_SI_GE = '荧四格'
const YING_SI_GE_TOU_XIANG = ['头像企划', '头像/表情包企划']
const YING_SI_GE_VIDEO = ['动画版', '配音版']
const YING_SI_GE_OTHER = [
  '限定图',
  '周边',
  '原神抽卡',
  '八重神子',
  '特典',
  '更新',
  '互动型',
  '调查',
  '家的',
  '关于',
  '大会',
  '纪念画',
  '贺图',
]

const POST_URL_PUBLIC = 'https://bbs.mihoyo.com/ys/article/'

const plainDB = getPlainDataDB()
await plainDB.read()

const parsedDB = getParsedDataDB()
await parsedDB.read()

parsedDB.data!.nickname = plainDB.data!.nickname
parsedDB.data!.lastUpdateTime = plainDB.data!.lastUpdateTime
// 清空原本的数据
parsedDB.data!.ysg = []
parsedDB.data!.ysg_avatar = []
parsedDB.data!.ysg_video = []
parsedDB.data!.ysg_other = []

plainDB.data?.records.forEach(({ data: recordsList }) => {
  recordsList.forEach((post) => {
    const { subject, post_id } = post
    const _post = { ...post, article: POST_URL_PUBLIC + post_id }

    const isYSG = subject.includes(YING_SI_GE)

    if (isYSG) {
      const isYSG_A = YING_SI_GE_TOU_XIANG.some((keyword) => subject.includes(keyword))
      const isYSG_V = YING_SI_GE_VIDEO.some((keyword) => subject.includes(keyword))
      const isYSG_O = YING_SI_GE_OTHER.some((keyword) => subject.includes(keyword))

      if (isYSG_A) parsedDB.data?.ysg_avatar.push(_post)
      else if (isYSG_V) parsedDB.data?.ysg_video.push(_post)
      else if (isYSG_O) parsedDB.data?.ysg_other.push(_post)
      else {
        // 兼容前10话
        const index = (subject.match(/(\d+(\.?\d+)?)|①②|③|④|⑤|⑥|⑦|⑧|⑨|⑩/) || [])[0]
        // console.log(index, subject)
        parsedDB.data?.ysg.push({ ..._post, index })
      }
      parsedDB.write()
    }
  })
})

// console.log(parsedDB.data?.ysg.length)
// console.log(parsedDB.data?.ysg_avatar.length)
// console.log(parsedDB.data?.ysg_video.length)
// console.log(parsedDB.data?.ysg_other.length)
