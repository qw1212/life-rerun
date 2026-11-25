import type {
  AttributeKey,
  EventType,
  OptionType,
  Perma,
  LifeStage,
} from '../types/game.js'

/**
 * 界面文案的唯一来源。
 *
 * 之前各页面各写一套标签，同一个属性在不同页面会显示成「智力 / 智慧」、
 * 「家境 / 丰盈」，玩家会以为是两个数值。统一放在这里，页面只负责渲染。
 */
export const ATTRIBUTE_META: Record<AttributeKey, { label: string; description: string }> = {
  intelligence: { label: '智力', description: '学习、理解与解决问题的能力' },
  physique: { label: '体质', description: '身体的活力与健康基础' },
  charm: { label: '魅力', description: '与人建立连接、被信任的能力' },
  wealth: { label: '家境', description: '可以调用的物质与社会资源' },
  luck: { label: '运气', description: '偶然机会出现的概率' },
  resilience: { label: '韧性', description: '面对挫折时的恢复力' },
}

export const PERMA_META: Record<keyof Perma, { label: string; description: string }> = {
  positive: { label: '积极情绪', description: '体验愉悦、温暖与满足的能力' },
  engagement: { label: '投入', description: '沉浸在喜欢的事情里的专注感' },
  relationships: { label: '关系', description: '被理解、被支持，也支持他人' },
  meaning: { label: '意义', description: '感到自己在做有价值的事' },
  achievement: { label: '成就', description: '为目标努力并看见进展' },
}

export const OPTION_TYPE_META: Record<
  OptionType,
  { label: string; description: string }
> = {
  safe: { label: '稳妥', description: '先稳住当下，降低不确定性' },
  adventure: { label: '冒险', description: '承担风险，换取更大的可能' },
  relationship: { label: '关系', description: '把人放在第一位' },
  growth: { label: '成长', description: '短期可能吃亏，长期积累能力' },
  acceptance: { label: '接纳', description: '承认局限，减少内耗' },
  meaning: { label: '意义', description: '选择更符合价值观的方向' },
}

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; description: string }
> = {
  normal: { label: '日常', description: '人生中普通却真实的一天' },
  highlight: { label: '高光', description: '被看见、被认可的时刻' },
  low: { label: '低谷', description: '一段需要被温柔对待的时期' },
  insight: { label: '顿悟', description: '低谷之后，重新理解自己的时刻' },
  breather: { label: '喘息', description: '先照顾好自己，再继续前行' },
  milestone: { label: '节点', description: '会影响人生方向的重要选择' },
}

/** 年龄阶段在界面上的补充说明，label 仍以 LIFE_STAGES 为准。 */
export const STAGE_HINT: Record<LifeStage, string> = {
  childhood: '在世界里第一次试探',
  adolescence: '寻找自己是谁',
  youth: '把想法变成现实的阶段',
  middleAge: '在责任与自我之间找平衡',
  oldAge: '回望、和解与传承',
}
