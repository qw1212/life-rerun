export interface CrisisResource {
  name: string
  /** 电话号码或网址 */
  contact: string
  description: string
  hours: string
  region: 'mainland' | 'emergency' | 'international'
}

/**
 * 危机干预资源清单。
 *
 * ⚠️ 上线前必须由运营方逐条核实号码有效性与服务时间，并按目标用户所在地区补充本地资源。
 * 未经核实不得对外发布。
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '全国统一心理援助热线',
    contact: '12356',
    description: '国家统一部署的心理援助热线，可直接拨打。',
    hours: '以各地公布的服务时间为准',
    region: 'mainland',
  },
  {
    name: '希望24热线',
    contact: '400-161-9995',
    description: '面向全国的公益心理危机干预热线。',
    hours: '24 小时',
    region: 'mainland',
  },
  {
    name: '北京心理危机研究与干预中心',
    contact: '010-82951332',
    description: '专业心理危机研究与干预机构。',
    hours: '24 小时',
    region: 'mainland',
  },
  {
    name: '紧急医疗救助',
    contact: '120',
    description: '出现自伤行为或身体处于危急状态时，请立即拨打。',
    hours: '24 小时',
    region: 'emergency',
  },
  {
    name: '报警求助',
    contact: '110',
    description: '当下有人身安全风险时，请立即拨打。',
    hours: '24 小时',
    region: 'emergency',
  },
  {
    name: '国际求助资源',
    contact: 'https://befrienders.org',
    description: '可查询所在国家或地区的危机求助热线。',
    hours: '—',
    region: 'international',
  },
]

export const CRISIS_DISCLAIMER =
  '本产品是心理自助与娱乐工具，不具备诊断或治疗功能，也无法提供紧急救助。如果你正在经历严重心理困扰，请立即联系下方专业资源。'

export const CRISIS_HARD_BLOCK_NOTICE =
  '我们注意到你可能正处于很大的痛苦之中。这一刻，比起继续游戏，我们更希望先陪你把安全放在第一位。'
