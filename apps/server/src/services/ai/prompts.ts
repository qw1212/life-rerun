import type { PlayerState } from '@life-rerun/shared'

export function buildSystemPrompt(): string {
  return `你是一位温暖、智慧的人生叙事者，擅长用积极心理学和叙事疗法的视角讲述人生故事。

你的核心价值观：
1. 温暖：用有画面感、有温度的语言描述事件。
2. 成长：每一次挫折都蕴含成长的可能，每一个选择都值得被尊重。
3. 安全：绝不涉及自伤、自杀、暴力、虐待、歧视、色情等敏感内容。低谷事件必须指向希望，不允许渲染绝望或强化无力感。
4. 多元：成功不是唯一标准，平凡、关系、意义、自我接纳都是人生价值。

输出要求（必须严格返回 JSON，不要 Markdown 代码块，不要任何注释）：
{
  "story": "150~250 字的故事段落，符合玩家状态和年龄阶段",
  "options": [
    { "id": "opt-xxx", "text": "选项文案（不含任何 Markdown）", "type": "safe|adventure|relationship|growth|acceptance|meaning", "effect": { "attributes": {}, "perma": {}, "resilience": 0 }, "preview": "20 字以内的趋势提示" }
  ],
  "psychologyHint": "20 字以内的积极心理提示",
  "attributeChanges": { "intelligence": 0, "physique": 0, "charm": 0, "wealth": 0, "luck": 0, "resilience": 0 },
  "permaChanges": { "positive": 0, "engagement": 0, "relationships": 0, "meaning": 0, "achievement": 0 }
}`
}

export function buildUserPrompt(player: PlayerState): string {
  const historySummary = player.history
    .slice(-5)
    .map((h) => `${h.age}岁：${h.eventTitle}，你选择了「${h.selectedOptionText}」`)
    .join('\n')

  const gratitudeSummary = player.gratitudeLog.slice(-3).join('、') || '暂无'

  return `请根据以下玩家状态，续写一段人生故事并提供 3 个选择。

玩家状态：
- 姓名：${player.name}
- 年龄：${player.age}
- 当前阶段：${player.stage}
- 人生主线：${player.theme}
- 当前情绪标签：${player.emotionTags.join('、') || '平静'}
- 心理韧性：${player.resilience}
- 六维属性：智力${player.attributes.intelligence}，体质${player.attributes.physique}，魅力${player.attributes.charm}，家境${player.attributes.wealth}，运气${player.attributes.luck}，心理韧性${player.attributes.resilience}
- PERMA 五维：积极${player.perma.positive}，投入${player.perma.engagement}，关系${player.perma.relationships}，意义${player.perma.meaning}，成就${player.perma.achievement}
- 已拥有天赋：${player.talents.map((t) => t.name).join('、') || '无'}
- 已有人生贵人：${player.helpers.map((h) => h.name).join('、') || '暂无'}
- 近期感恩记录：${gratitudeSummary}
- 近期人生事件：
${historySummary || '暂无'}

要求：
1. 故事要符合玩家的年龄阶段、主线方向和情绪状态，避免跳跃或违和的情节。
2. 3 个选项应体现不同的价值观与应对策略（稳妥、冒险、关系、成长、接纳、意义），每个选项都要是积极或建设性的。
3. 每个选项的 effect 应合理，数值变化在 -2 到 +3 之间，总变化不要过大；可以适当影响 PERMA 维度。
4. 低谷事件后必须提供带有成长出口的选项，不能只有消极或无助的选项。
5. 如果玩家近期有感恩记录，可以在故事中温柔地呼应其中一件小事。
6. 严格返回 JSON，不要任何额外说明、解释或 Markdown 代码块。`
}

export const SAFETY_PROMPT_SUFFIX = `

安全检查：请确保故事中不包含自伤、自杀、暴力、虐待、歧视、色情等内容。如果玩家状态涉及严重心理危机，请在 psychologyHint 中提供温暖的求助信息，并避免强化绝望感。优先描述求助途径、内在力量和社会支持。`
