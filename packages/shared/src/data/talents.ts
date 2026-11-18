import type { Talent } from '../types/game.js'

export const TALENTS: Talent[] = [
  // 普通天赋：属性加成
  {
    id: 'born-smart',
    name: '早慧',
    description: '从小对知识充满好奇，智力高于常人。',
    type: 'normal',
    effect: { attributes: { intelligence: 8 } },
  },
  {
    id: 'strong-body',
    name: '强健体魄',
    description: '身体素质出众，精力充沛。',
    type: 'normal',
    effect: { attributes: { physique: 8 } },
  },
  {
    id: 'natural-charm',
    name: '亲和力强',
    description: '人们容易喜欢你，社交如鱼得水。',
    type: 'normal',
    effect: { attributes: { charm: 8 } },
  },
  {
    id: 'wealthy-family',
    name: '家境优渥',
    description: '出生在一个资源充足的家庭。',
    type: 'normal',
    effect: { attributes: { wealth: 8 } },
  },
  {
    id: 'lucky-star',
    name: '幸运星',
    description: '关键时刻总有意外之喜。',
    type: 'normal',
    effect: { attributes: { luck: 8 } },
  },
  {
    id: 'street-smart',
    name: '机灵鬼',
    description: '反应快，善于在复杂环境中找到出路。',
    type: 'normal',
    effect: { attributes: { intelligence: 4, luck: 4 } },
  },
  {
    id: 'golden-voice',
    name: '动人嗓音',
    description: '声音有感染力，容易打动他人。',
    type: 'normal',
    effect: { attributes: { charm: 6 } },
  },

  // 特殊天赋：解锁隐藏剧情
  {
    id: 'hidden-genius',
    name: '隐藏的天才',
    description: '某项潜能直到特定时刻才会觉醒。',
    type: 'special',
    effect: { attributes: { intelligence: 5 }, unlockEventIds: ['event-genius-awaken'] },
  },
  {
    id: 'fated-meeting',
    name: '命中贵人',
    description: '在人生关键节点更容易遇到贵人。',
    type: 'special',
    effect: { unlockEventIds: ['event-mentor-appears', 'event-stranger-kindness'] },
  },
  {
    id: 'second-chance',
    name: '重来一次',
    description: '重大失败后，命运会悄悄再给你一次机会。',
    type: 'special',
    effect: { unlockEventIds: ['event-second-chance'] },
  },
  {
    id: 'artistic-soul',
    name: '艺术灵魂',
    description: '对美的敏感让你更容易走上艺术之路。',
    type: 'special',
    effect: { attributes: { charm: 4 }, unlockTheme: 'art', unlockEventIds: ['event-art-call'] },
  },
  {
    id: 'social-mission',
    name: '社会使命感',
    description: '从小关心他人，注定要影响更多人。',
    type: 'special',
    effect: { attributes: { charm: 4 }, unlockTheme: 'social', unlockEventIds: ['event-volunteer-spark'] },
  },

  // 心理天赋
  {
    id: 'resilient-heart',
    name: '坚韧的心',
    description: '低谷时恢复更快，心理韧性更高。',
    type: 'psychology',
    effect: { attributes: { resilience: 10 }, resilienceBonus: 5 },
  },
  {
    id: 'growth-mindset',
    name: '成长型思维',
    description: '把挑战视为学习机会，顿悟事件更容易触发。',
    type: 'psychology',
    effect: { attributes: { resilience: 6, intelligence: 3 } },
  },
  {
    id: 'grateful-heart',
    name: '感恩之心',
    description: '更容易注意到生活中的美好。',
    type: 'psychology',
    effect: { attributes: { resilience: 5, charm: 3 } },
  },
  {
    id: 'inner-peace',
    name: '内心宁静',
    description: '焦虑不易侵蚀你，情绪更稳定。',
    type: 'psychology',
    effect: { resilienceBonus: 8 },
  },
]

export function getTalentById(id: string): Talent | undefined {
  return TALENTS.find((t) => t.id === id)
}

export function drawTalents(count = 3): Talent[] {
  const shuffled = [...TALENTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
