import {
  ATTRIBUTE_META,
  LIFE_STAGES,
  PERMA_META,
  THEME_META,
  type PlayerState,
} from '@life-rerun/shared'

const HELPER_ROLE_LABELS: Record<PlayerState['helpers'][number]['role'], string> = {
  mentor: '导师',
  friend: '挚友',
  partner: '伴侣',
  stranger: '过客',
}

export function buildSystemPrompt(): string {
  return `你是一位温暖、智慧的人生叙事者，擅长用积极心理学和叙事疗法的视角讲述人生故事。

你的核心价值观：
1. 温暖：用有画面感、有温度的语言描述事件。
2. 成长：每一次挫折都蕴含成长的可能，每一个选择都值得被尊重。
3. 安全：绝不涉及自伤、自杀、暴力、虐待、歧视、色情等敏感内容。低谷事件必须指向希望，不允许渲染绝望或强化无力感。
4. 多元：成功不是唯一标准，平凡、关系、意义、自我接纳都是人生价值。

输出要求（必须严格返回 JSON，不要 Markdown 代码块，不要任何注释）：
{
  "type": "normal | highlight | insight | breather",
  "title": "12 字以内的事件标题",
  "story": "150~250 字的故事段落，符合玩家状态和年龄阶段",
  "options": [
    { "id": "opt-xxx", "text": "选项文案（不含任何 Markdown）", "type": "safe|adventure|relationship|growth|acceptance|meaning", "effect": { "attributes": {}, "perma": {}, "resilience": 0 }, "preview": "20 字以内的趋势提示" }
  ],
  "psychologyHint": "20 字以内的积极心理提示"
}

type 取值说明：
- normal：普通日常事件
- highlight：被看见、被认可的高光时刻
- insight：低谷之后的顿悟与重新理解
- breather：压力过大时的喘息与自我照顾
禁止输出「低谷」事件：低谷必须由系统事件库提供，以保证一定有成长出口。

硬性约束：
- 必须给出 3 个选项，全部是积极或建设性的。
- attributes / perma 每项变化在 -3 到 +3 之间，resilience 在 -5 到 +5 之间，不要出现夸张数值。
- 不要输出 theme、unlockTalent、addHelper 等系统字段。`
}

export function buildUserPrompt(player: PlayerState): string {
  const historySummary = player.history
    .slice(-5)
    .map(
      (h) =>
        `${h.age}岁：${h.eventTitle}，你选择了「${h.selectedOptionText}」${
          h.psychologyHint ? `（当时提示：${h.psychologyHint}）` : ''
        }`
    )
    .join('\n')

  const gratitudeSummary = player.gratitudeLog.slice(-3).join('、') || '暂无'
  const stageMeta = LIFE_STAGES[player.stage]
  const themeMeta = THEME_META[player.theme]

  const attributes = (Object.keys(ATTRIBUTE_META) as (keyof typeof ATTRIBUTE_META)[])
    .map((key) => `${ATTRIBUTE_META[key].label}${player.attributes[key]}`)
    .join('，')

  const perma = (Object.keys(PERMA_META) as (keyof typeof PERMA_META)[])
    .map((key) => `${PERMA_META[key].label}${player.perma[key]}`)
    .join('，')

  const talents = player.talents.map((t) => t.name).join('、') || '无'
  const helpers =
    player.helpers
      .map((h) => `${h.name}（${HELPER_ROLE_LABELS[h.role] ?? '重要的人'}）`)
      .join('、') || '暂无'
  const emotionTags = player.emotionTags.join('、') || '平静'

  return `请根据以下玩家状态，续写一段人生故事并提供 3 个选择。

玩家状态：
- 姓名：${player.name}
- 年龄：${player.age} 岁（${stageMeta.label}阶段：${stageMeta.range.min}~${stageMeta.range.max} 岁）
- 人生主线：${themeMeta.label} —— ${themeMeta.description}
- 当前情绪：${emotionTags}
- 心理韧性：${player.resilience}/100
- 六维属性：${attributes}
- PERMA 五维：${perma}
- 已拥有天赋：${talents}
- 重要的人：${helpers}
- 近期感恩记录：${gratitudeSummary}
- 近期人生事件：
${historySummary || '暂无'}

要求：
1. 故事要符合玩家的年龄阶段、主线方向和情绪状态，避免跳跃或违和的情节。
2. 3 个选项应体现不同的价值观与应对策略（稳妥、冒险、关系、成长、接纳、意义），每个选项都要是积极或建设性的。
3. 每个选项的 effect 应合理，数值变化在 -2 到 +3 之间，总变化不要过大；可以适当影响 PERMA 维度。
4. 如果玩家近期情绪低落或心理韧性偏低，请输出 breather 或 insight 类型，并给出温暖的自我照顾建议。
5. 如果玩家近期有感恩记录，可以在故事中温柔地呼应其中一件小事。
6. 严格返回 JSON，不要任何额外说明、解释或 Markdown 代码块。`
}

export const SAFETY_PROMPT_SUFFIX = `

安全检查：请确保故事中不包含自伤、自杀、暴力、虐待、歧视、色情等内容。如果玩家状态涉及严重心理危机，请在 psychologyHint 中提供温暖的求助信息，并避免强化绝望感。优先描述求助途径、内在力量和社会支持。`
