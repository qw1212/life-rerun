import type { GameEvent, LifeStage, OptionType, OptionEffect } from '../types/game.js'

function opt(id: string, text: string, type: OptionType, effect: OptionEffect, preview?: string) {
  return { id, text, type, effect, preview }
}

function ev(
  id: string,
  type: GameEvent['type'],
  stage: LifeStage | 'any',
  title: string,
  story: string,
  options: GameEvent['options'],
  psychologyHint: string,
  triggerCondition?: GameEvent['triggerCondition'],
  followUp?: GameEvent['followUp']
): GameEvent {
  return { id, type, stage, title, story, options, psychologyHint, triggerCondition, followUp }
}

export const EVENTS: GameEvent[] = [
  // ===== 童年（0-12）普通事件 6 =====
  ev('event-first-day-school', 'normal', 'childhood', '第一天上小学', '你背着新书包站在教室门口，里面满是陌生又好奇的面孔。老师微笑着向你招手。', [
    opt('opt-walk-in', '安静地走进去', 'safe', { attributes: { resilience: 1 } }, '稳妥适应新环境'),
    opt('opt-say-hi', '主动和同学打招呼', 'relationship', { attributes: { charm: 2 } }, '建立早期友谊'),
    opt('opt-look-around', '先观察一会儿', 'growth', { attributes: { intelligence: 1, resilience: 1 } }, '谨慎而有觉察'),
  ], '每一次新开始，都是勇气的练习。'),

  ev('event-lost-toy', 'normal', 'childhood', '心爱的玩具不见了', '你最喜欢的玩具突然找不到了，翻遍了房间也没有。眼泪在眼眶里打转。', [
    opt('opt-ask-help', '请父母一起找', 'relationship', { attributes: { charm: 1 } }),
    opt('opt-calm-search', '深呼吸，再仔细找一遍', 'growth', { attributes: { resilience: 2 } }),
    opt('opt-accept-missing', '也许它去了新的冒险', 'acceptance', { attributes: { resilience: 1, luck: 1 } }),
  ], '失去教会我们珍惜，也教会我们放手。'),

  ev('event-classmate-conflict', 'normal', 'childhood', '和同桌吵架', '同桌不小心弄坏了你的画，你气得大声说了难听的话。现在你们谁也不理谁。', [
    opt('opt-apologize', '先为自己的话道歉', 'growth', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-wait', '等对方先开口', 'safe', { attributes: { resilience: 1 } }),
    opt('opt-new-friend', '去找其他同学玩', 'relationship', { attributes: { charm: 1, luck: 1 } }),
  ], '修复关系比输赢更重要。'),

  ev('event-summer-night', 'normal', 'childhood', '夏夜看星星', '停电的夜晚，全家人坐在院子里乘凉。爷爷指着天上的星星，讲他年轻时的故事。', [
    opt('opt-listen', '安静地听爷爷讲', 'safe', { attributes: { intelligence: 1, resilience: 1 } }),
    opt('opt-imagine', '想象星星上的世界', 'growth', { attributes: { intelligence: 2 } }),
    opt('opt-share', '也讲一个自己的故事', 'relationship', { attributes: { charm: 2 } }),
  ], '家人的故事，是我们最早的灯塔。'),

  ev('event-race-day', 'normal', 'childhood', '学校运动会', '你报名了短跑比赛，站在起跑线上，心跳得像鼓一样。', [
    opt('opt-sprint', '全力以赴冲向终点', 'adventure', { attributes: { physique: 2, luck: 1 } }),
    opt('opt-steady', '保持节奏，坚持到底', 'safe', { attributes: { physique: 1, resilience: 1 } }),
    opt('opt-cheer', '为所有同学加油', 'relationship', { attributes: { charm: 2 } }),
  ], '重要的不是名次，而是你迈出的那一步。'),

  ev('event-magic-show', 'normal', 'childhood', '魔术表演', '学校来了魔术师，他邀请一位小朋友上台配合。全班都看向你。', [
    opt('opt-volunteer', '举手上台', 'adventure', { attributes: { charm: 2, luck: 1 } }),
    opt('opt-watch', '认真观看，记住细节', 'growth', { attributes: { intelligence: 2 } }),
    opt('opt-hide', '低下头，希望不被点到', 'safe', { attributes: { resilience: 1 } }),
  ], '被看见是一种勇气，安静观察也是一种智慧。'),

  // ===== 童年 高光 2 / 低谷 1 / 顿悟 1 =====
  ev('event-young-talent', 'highlight', 'childhood', '被老师发现天赋', '美术老师把你的画贴在了教室最显眼的位置，说你有独特的眼光。', [
    opt('opt-proud', '心里暗暗自豪，更努力画画', 'growth', { attributes: { intelligence: 2, resilience: 1 }, unlockTalent: 'artistic-soul' }),
    opt('opt-share', '把画送给最好的朋友', 'relationship', { attributes: { charm: 2 } }),
    opt('opt-dream', '梦想以后成为画家', 'meaning', { attributes: { intelligence: 1, luck: 1 } }),
  ], '被认可的那一刻，光就照进了心里。', { minAttributes: { charm: 55 } }),

  ev('event-parents-argue', 'low', 'childhood', '父母吵架的夜晚', '夜里你被争吵声惊醒，缩在被子里不敢出声。第二天家里气氛冷冰冰的。', [
    opt('opt-self-care', '告诉自己这不是你的错', 'growth', { attributes: { resilience: 2 } }),
    opt('opt-talk', '找信任的亲人倾诉', 'relationship', { attributes: { resilience: 1, charm: 1 } }),
    opt('opt-draw', '把感受画下来', 'growth', { attributes: { intelligence: 1, resilience: 1 } }),
  ], '大人的风暴不是你的错，你依然值得被温柔对待。'),

  ev('event-insight-childhood', 'insight', 'childhood', '雨后的小草', '雨过天晴，你看到被踩倒的小草又慢慢直了起来。那一刻，你好像明白了什么。', [
    opt('opt-remember', '记住这个画面，难过时想一想', 'growth', { attributes: { resilience: 3 } }),
    opt('opt-share-lesson', '告诉朋友小草的故事', 'relationship', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-plant', '种下一颗自己的种子', 'meaning', { attributes: { resilience: 2, luck: 1 } }),
  ], '生命会自己找到出路，你也是。'),

  // ===== 青少年（13-18）普通事件 6 =====
  ev('event-exam-pressure', 'normal', 'adolescence', '考试压力', '期中考试越来越近，你感到胸口发闷，夜里睡不好。', [
    opt('opt-plan', '制定复习计划，按部就班', 'safe', { attributes: { intelligence: 2 } }),
    opt('opt-rest', '先好好休息一晚', 'acceptance', { attributes: { physique: 1, resilience: 1 } }),
    opt('opt-study-group', '约同学一起复习', 'relationship', { attributes: { intelligence: 1, charm: 1 } }),
  ], '效率不是压榨自己，而是照顾好自己再出发。'),

  ev('event-first-love', 'normal', 'adolescence', '第一次心动', '班上有个同学总会让你不自觉地多看几眼。今天你们被分到一组做值日。', [
    opt('opt-chat', '鼓起勇气聊几句', 'relationship', { attributes: { charm: 2, luck: 1 } }),
    opt('opt-focus', '把注意力放回学习上', 'safe', { attributes: { intelligence: 2 } }),
    opt('opt-diary', '把心情写进日记', 'growth', { attributes: { resilience: 2 } }),
  ], '心动是青春的诗，不必急着翻页。'),

  ev('event-peer-pressure', 'normal', 'adolescence', '朋友的怂恿', '几个朋友提议翘课去网吧，还说不去就不是兄弟。', [
    opt('opt-refuse', '委婉拒绝，坚持自己的节奏', 'growth', { attributes: { resilience: 2, intelligence: 1 } }),
    opt('opt-go', '跟着去一次，怕被孤立', 'relationship', { attributes: { charm: 1, luck: -1 } }),
    opt('opt-suggest', '提议周末一起去打球', 'relationship', { attributes: { charm: 2, physique: 1 } }),
  ], '真正的朋友尊重你的选择。'),

  ev('event-teacher-criticism', 'normal', 'adolescence', '被当众批评', '数学老师当着全班的面说你不努力，同学们窃窃私语。你的脸烧得发烫。', [
    opt('opt-prove', '默默努力，用成绩回应', 'growth', { attributes: { intelligence: 2, resilience: 2 } }),
    opt('opt-talk-after', '课后找老师沟通', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-ignore', '告诉自己一句话不能定义我', 'acceptance', { attributes: { resilience: 3 } }),
    {
      id: 'opt-channel-criticism',
      text: '把委屈写成文字或画出来，转化情绪',
      type: 'growth',
      hidden: true,
      unlockCondition: { minResilience: 60 },
      effect: { attributes: { intelligence: 1, resilience: 3 }, addTag: '希望' },
      preview: '高韧性解锁：把情绪化为创造',
    },
  ], '一句批评是信息，不是判决书。'),

  ev('event-summer-job', 'normal', 'adolescence', '暑假兼职', '你想用暑假赚点零花钱，去了一家书店帮忙。', [
    opt('opt-learn', '观察店长怎么经营', 'growth', { attributes: { intelligence: 2, wealth: 1 } }),
    opt('opt-save', '把钱存起来', 'safe', { attributes: { wealth: 2 } }),
    opt('opt-recommend', '向客人推荐喜欢的书', 'relationship', { attributes: { charm: 2 } }),
  ], '劳动让你触摸到世界的真实纹理。'),

  ev('event-hobby-choice', 'normal', 'adolescence', '兴趣与学业的冲突', '你迷上了弹吉他，但父母认为会影响学习，想让你停掉。', [
    opt('opt-negotiate', '和父母约定时间分配', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-focus-study', '暂时放下吉他，专心考试', 'safe', { attributes: { intelligence: 2 } }),
    opt('opt-persist', '偷偷坚持，相信音乐很重要', 'meaning', { attributes: { resilience: 2, luck: 1 } }),
  ], '热爱和学业可以共存，关键在于沟通。'),

  // ===== 青少年 高光 2 / 低谷 1 / 顿悟 1 =====
  ev('event-contest-win', 'highlight', 'adolescence', '竞赛获奖', '你参加了全市作文比赛，意外拿到了二等奖。领奖时你看到了父母骄傲的眼神。', [
    opt('opt-grateful', '感谢老师和家人的支持', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-deeper', '决定更深入地阅读和写作', 'growth', { attributes: { intelligence: 3 } }),
    opt('opt-share', '把奖金捐给班级图书角', 'meaning', { attributes: { charm: 2 } }),
  ], '你的努力，世界看得见。', { minAttributes: { intelligence: 55 } }),

  ev('event-bullying', 'low', 'adolescence', '被排挤的午餐时间', '最近有几个同学总在背后议论你，今天午饭时你发现自己落单了。', [
    opt('opt-find-ally', '主动靠近友善的同学', 'relationship', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-self-soothe', '去图书馆看一本喜欢的书', 'growth', { attributes: { intelligence: 1, resilience: 2 } }),
    opt('opt-tell-teacher', '向老师或家长说明情况', 'safe', { attributes: { resilience: 2 } }),
  ], '孤立是一时的，你的价值不取决于有没有人陪你吃饭。'),

  ev('event-insight-adolescence', 'insight', 'adolescence', '镜子里的自己', '你盯着镜子，突然意识到：我不是别人眼中的我，我是我自己选择成为的人。', [
    opt('opt-accept-self', '接纳此刻真实的自己', 'acceptance', { attributes: { resilience: 3 } }),
    opt('opt-set-boundary', '对那些评价说"这不能定义我"', 'growth', { attributes: { resilience: 2, charm: 1 } }),
    opt('opt-write-letter', '给未来的自己写一封信', 'meaning', { attributes: { resilience: 2, intelligence: 1 } }),
  ], '你是谁，由你一次又一次的选择决定。'),

  // ===== 青年（19-35）普通事件 6 =====
  ev('event-major-choice', 'milestone', 'youth', '选择专业/职业方向', '高考志愿或第一份工作的选择摆在你面前，你站在人生的岔路口。', [
    opt('opt-passion', '追随内心的热爱', 'meaning', { attributes: { intelligence: 1, resilience: 1 }, theme: 'art' }),
    opt('opt-stable', '选择更稳妥的道路', 'safe', { attributes: { intelligence: 2, wealth: 1 } }),
    opt('opt-advice', '听取父母长辈的建议', 'relationship', { attributes: { charm: 1, wealth: 1 } }),
  ], '没有完美的选择，只有认真对待的当下。'),

  ev('event-first-rejection', 'normal', 'youth', '第一次被拒绝', '你投了十几份简历，或者向喜欢的人表白，结果都被拒绝了。', [
    opt('opt-reflect', '复盘一下，调整方向', 'growth', { attributes: { intelligence: 2, resilience: 1 } }),
    opt('opt-persist', '继续尝试，不气馁', 'adventure', { attributes: { luck: 1, resilience: 1 } }),
    opt('opt-self-care', '先允许自己难过一天', 'acceptance', { attributes: { resilience: 2 } }),
  ], '拒绝是筛选，不是否定。'),

  ev('event-roommate', 'normal', 'youth', '与室友的矛盾', '室友的生活习惯和你差别很大，脏衣服堆成山，深夜还在打游戏。', [
    opt('opt-communicate', '平静地沟通边界', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-tolerance', '调整自己的期待', 'acceptance', { attributes: { resilience: 2 } }),
    opt('opt-schedule', '制定共同的生活公约', 'safe', { attributes: { intelligence: 1, resilience: 1 } }),
  ], '清晰的边界是健康关系的基础。'),

  ev('event-side-project', 'normal', 'youth', '副业/创业的想法', '你有了一个想做的小项目，但工作之余的时间和精力都很有限。', [
    opt('opt-start-small', '用最小成本先试一试', 'adventure', { attributes: { intelligence: 2, luck: 1 } }),
    opt('opt-save-energy', '先做好本职工作', 'safe', { attributes: { wealth: 1, resilience: 1 } }),
    opt('opt-find-partner', '找志同道合的人一起', 'relationship', { attributes: { charm: 2, intelligence: 1 } }),
  ], '伟大的开始，往往只占用一个周末的下午。'),

  ev('event-family-expectation', 'normal', 'youth', '家人的期待', '父母希望你回老家考公务员，而你想留在大城市试试。', [
    opt('opt-explain', '认真解释你的想法和计划', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-compromise', '先按父母说的做，再找机会', 'safe', { attributes: { wealth: 1, resilience: 1 } }),
    opt('opt-pursue', '坚持自己的路，但保持联系', 'adventure', { attributes: { resilience: 2, luck: 1 } }),
  ], '孝顺不是复制父母的人生。'),

  ev('event-health-warning', 'normal', 'youth', '身体发出警告', '连续加班后，你感到心悸和失眠，体检报告也出现了几个箭头。', [
    opt('opt-rest', '立刻调整作息', 'acceptance', { attributes: { physique: 2, resilience: 1 } }),
    opt('opt-exercise', '开始规律运动', 'growth', { attributes: { physique: 2, resilience: 1 } }),
    opt('opt-checkup', '预约全面体检', 'safe', { attributes: { intelligence: 1, physique: 1 } }),
  ], '身体是最诚实的提醒者。'),

  // ===== 青年 高光 2 / 低谷 1 / 顿悟 1 =====
  ev('event-startup-success', 'highlight', 'youth', '项目初战告捷', '你参与的创业项目拿到了第一笔投资，团队聚餐时大家眼里都有光。', [
    opt('opt-reinvest', '把收益投入团队成长', 'relationship', { attributes: { charm: 2, wealth: 1 } }),
    opt('opt-learn', '趁势学习管理和融资', 'growth', { attributes: { intelligence: 3 } }),
    opt('opt-celebrate', '和团队好好庆祝', 'acceptance', { attributes: { resilience: 2 } }),
  ], '团队的成功，是每个人光芒的集合。', { minAttributes: { intelligence: 60, luck: 50 } }),

  ev('event-breakup', 'low', 'youth', '一段感情的结束', '你们和平分手，或者经历了激烈的争吵后分开。心里空了一块。', [
    opt('opt-grieve', '允许自己悲伤，不假装坚强', 'acceptance', { attributes: { resilience: 2 } }),
    opt('opt-friends', '多和朋友在一起', 'relationship', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-reflect', '写下这段关系教会你的事', 'growth', { attributes: { resilience: 2, intelligence: 1 } }),
  ], '结束也是人生的一部分，它会带你走向更适合的人。'),

  ev('event-insight-youth', 'insight', 'youth', '孤独的夜晚', '深夜加班回家的路上，你突然意识到：真正的自由，是敢于对自己诚实。', [
    opt('opt-honest', '对自己承认真正想要的生活', 'growth', { attributes: { resilience: 3 } }),
    opt('opt-small-step', '从一件小事开始改变', 'safe', { attributes: { resilience: 1, intelligence: 1 } }),
    opt('opt-share-vulnerability', '对信任的人说出真实感受', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
  ], '孤独不是问题，逃避自己才是。'),

  // ===== 中年（36-55）普通事件 6 =====
  ev('event-career-plateau', 'normal', 'middleAge', '职业瓶颈', '你在同一岗位上做了多年，升职加薪都遇到了天花板。', [
    opt('opt-skill', '学习新技能，寻找突破口', 'growth', { attributes: { intelligence: 2, luck: 1 } }),
    opt('opt-balance', '把重心转向家庭和生活', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-coach', '找职业导师聊一聊', 'safe', { attributes: { intelligence: 1, resilience: 1 } }),
  ], '瓶颈期是重新认识自己价值的时机。'),

  ev('event-parent-aging', 'normal', 'middleAge', '父母渐渐变老', '你发现父母的动作变慢了，电话里的嘱咐变多了。他们开始依赖你。', [
    opt('opt-visit', '增加陪伴他们的时间', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-plan', '和父母一起规划养老', 'safe', { attributes: { intelligence: 2, wealth: 1 } }),
    opt('opt-gratitude', '常常表达感谢', 'meaning', { attributes: { resilience: 2 } }),
  ], '亲情的功课，是学会在有限的时间里好好告别。'),

  ev('event-marriage', 'milestone', 'middleAge', '婚姻中的平淡期', '婚后的激情慢慢褪去，日子像一杯温水。你们都在忙碌，却很少交流。', [
    opt('opt-date', '安排一次只有两人的约会', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-talk-heart', '认真谈一次彼此的需求', 'growth', { attributes: { resilience: 2, charm: 1 } }),
    opt('opt-hobby-together', '一起培养一个新的共同爱好', 'meaning', { attributes: { resilience: 1, charm: 1 } }),
  ], '爱需要经营，而不是等待它自己燃烧。'),

  ev('event-financial-stress', 'normal', 'middleAge', '经济压力', '房贷、教育、养老的开支像山一样压来，你开始失眠。', [
    opt('opt-budget', '做一份详细的家庭预算', 'safe', { attributes: { intelligence: 2, wealth: 1 } }),
    opt('opt-talk-partner', '和伴侣一起面对', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-side-income', '寻找合理的副业机会', 'adventure', { attributes: { intelligence: 1, wealth: 1 } }),
  ], '财务压力可以拆解，第一步是面对现实。'),

  ev('event-volunteer-opportunity', 'normal', 'middleAge', '志愿服务机会', '社区组织公益活动，组织者问你愿不愿意长期参与。', [
    opt('opt-commit', '定期参与，帮助更多人', 'meaning', { attributes: { charm: 2, resilience: 1 }, theme: 'social' }),
    opt('opt-donate', '捐一些钱，但没时间到场', 'safe', { attributes: { wealth: -1, charm: 1 } }),
    opt('opt-family', '带孩子一起参加', 'relationship', { attributes: { charm: 2, intelligence: 1 } }),
  ], '给予本身就是一种丰盛。'),

  // ===== 中年 高光 2 / 低谷 1 / 顿悟 1 =====
  ev('event-career-peak', 'highlight', 'middleAge', '事业高峰', '你主导的项目大获成功，公司决定给你升职和股权激励。', [
    opt('opt-team', '把荣誉归功于团队', 'relationship', { attributes: { charm: 3, resilience: 1 } }),
    opt('opt-invest', '用奖金投资自己和家人', 'safe', { attributes: { wealth: 3, intelligence: 1 } }),
    opt('opt-dream', '启动一个酝酿多年的计划', 'meaning', { attributes: { intelligence: 2, luck: 1 } }),
  ], '高峰是对坚持的奖励，也是新的起点。'),

  ev('event-recognition', 'highlight', 'middleAge', '曾经否定你的人认可了你', '当年不看好你的亲戚/老师主动提起你的成就，语气里满是惊讶。', [
    opt('opt-grace', '微笑着说谢谢', 'relationship', { attributes: { charm: 3, resilience: 2 } }),
    opt('opt-indifferent', '不放在心上，专注自己的路', 'acceptance', { attributes: { resilience: 3 } }),
    opt('opt-share-story', '分享一路走来的真实困难', 'growth', { attributes: { charm: 2, resilience: 1 } }),
  ], '真正的胜利是不再需要别人的认可来证明自己。', { requiredEvents: ['event-teacher-criticism'] }),

  ev('event-midlife-crisis', 'low', 'middleAge', '中年危机', '某天醒来，你突然问自己：这就是我要的人生吗？一股巨大的空虚感袭来。', [
    opt('opt-explore', '尝试一件从未做过的事', 'adventure', { attributes: { resilience: 2, luck: 1 } }),
    opt('opt-therapy', '寻求心理咨询，梳理内心', 'growth', { attributes: { resilience: 3, intelligence: 1 } }),
    opt('opt-reconnect', '重新联系年轻时在乎的东西', 'meaning', { attributes: { resilience: 2, charm: 1 } }),
  ], '危机是内心在提醒你：有些需求被忽略了太久。'),

  ev('event-insight-middle', 'insight', 'middleAge', '孩子的提问', '孩子问你："爸爸/妈妈，你小时候的梦想是什么？"你一时语塞。', [
    opt('opt-remember-dream', '认真回想，并告诉孩子', 'growth', { attributes: { resilience: 2, charm: 1 } }),
    opt('opt-revive', '把梦想的一部分重新拾起来', 'meaning', { attributes: { resilience: 3, intelligence: 1 } }),
    opt('opt-new-dream', '和孩子一起许一个新的愿望', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
  ], '梦想不会过期，只是换了一种实现的方式。'),

  // ===== 老年（56+）普通事件 4 =====
  ev('event-retirement', 'milestone', 'oldAge', '退休', '你正式退休了，再也不用赶早高峰。时间突然变得很慢。', [
    opt('opt-plan', '规划退休后的生活节奏', 'safe', { attributes: { resilience: 2, intelligence: 1 } }),
    opt('opt-travel', '去看看年轻时没去的地方', 'adventure', { attributes: { physique: 1, luck: 1 } }),
    opt('opt-grandchild', '多花时间陪伴孙辈', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
  ], '退休不是结束，而是另一种开始。'),

  ev('event-new-hobby', 'normal', 'oldAge', '发展新爱好', '社区开设书法班，你年轻时一直想学但没机会。', [
    opt('opt-join', '报名学习，不晚', 'growth', { attributes: { intelligence: 2, resilience: 1 } }),
    opt('opt-teach', '如果你会，就去当志愿者老师', 'relationship', { attributes: { charm: 2, intelligence: 1 } }),
    opt('opt-watch', '先在旁边看看，慢慢决定', 'safe', { attributes: { resilience: 1 } }),
  ], '学习是终身的事，什么时候开始都不晚。'),

  ev('event-reconcile', 'normal', 'oldAge', '与旧友和解', '你得知一位多年不联系的老朋友身体不好了，心里有些放不下。', [
    opt('opt-call', '主动打个电话', 'relationship', { attributes: { charm: 2, resilience: 2 } }),
    opt('opt-letter', '写一封信，把想说的话寄出', 'growth', { attributes: { resilience: 2, intelligence: 1 } }),
    opt('opt-let-go', '在心里原谅彼此', 'acceptance', { attributes: { resilience: 3 } }),
  ], '和解不一定要说出口，但必须放在心里。'),

  ev('event-health-decline', 'normal', 'oldAge', '身体逐渐衰弱', '爬楼梯开始气喘，医生建议你减少剧烈活动。', [
    opt('opt-adapt', '调整生活方式，接受变化', 'acceptance', { attributes: { resilience: 3 } }),
    opt('opt-exercise-senior', '选择适合老人的运动', 'growth', { attributes: { physique: 2, resilience: 1 } }),
    opt('opt-family-care', '让家人多参与你的生活', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
  ], '身体的限制不意味着生活的结束。'),

  // ===== 老年 高光 1 / 低谷 1 / 顿悟 1 =====
  ev('event-life-legacy', 'highlight', 'oldAge', '留下点什么', '你决定把一生的经验和故事整理出来，留给后人。', [
    opt('opt-write-memoir', '写一本回忆录', 'growth', { attributes: { intelligence: 3, resilience: 1 } }),
    opt('opt-mentor-youth', '担任年轻人的导师', 'relationship', { attributes: { charm: 3, intelligence: 1 } }),
    opt('opt-family-tree', '整理家谱和老照片', 'meaning', { attributes: { charm: 2, resilience: 1 } }),
  ], '生命的价值在于它如何照亮后来者。'),

  ev('event-loss-spouse', 'low', 'oldAge', '伴侣离世', '相守几十年的伴侣先走一步，家里每一个角落都有回忆。', [
    opt('opt-grieve', '允许悲伤慢慢流淌', 'acceptance', { attributes: { resilience: 3 } }),
    opt('opt-community', '加入互助小组，和相似经历的人交流', 'relationship', { attributes: { charm: 2, resilience: 2 } }),
    opt('opt-ritual', '用某种仪式纪念对方', 'meaning', { attributes: { resilience: 3 } }),
  ], '爱不会消失，只是换了一种存在方式。'),

  ev('event-insight-old', 'insight', 'oldAge', '回望一生', '坐在夕阳下，你回想这一生的大起大落，忽然笑了。', [
    opt('opt-grateful', '感恩所有经历，包括挫折', 'acceptance', { attributes: { resilience: 4 } }),
    opt('opt-share-story', '把故事讲给年轻人听', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-peace', '静静地看着夕阳落下', 'meaning', { attributes: { resilience: 3 } }),
  ], '人生的意义不在于完美，而在于真实。'),

  // ===== 跨阶段特殊事件 8 =====
  ev('event-stranger-kindness', 'breather', 'any', '陌生人的善意', '心情低落时，一位陌生人对你笑了笑，或者帮你扶了一下门。', [
    opt('opt-pass-on', '把善意传递出去', 'relationship', { attributes: { charm: 2, resilience: 1 } }),
    opt('opt-remember', '记住这个温暖瞬间', 'acceptance', { attributes: { resilience: 2 } }),
    opt('opt-smile', '也对下一个遇到的人微笑', 'relationship', { attributes: { charm: 1, resilience: 1 } }),
  ], '世界很大，但温暖可以很小。'),

  ev('event-second-chance', 'breather', 'any', '命运转机', '一件你以为已经失去的事，突然出现了转机。', [
    opt('opt-grab', '抓住机会', 'adventure', { attributes: { luck: 2, resilience: 1 } }),
    opt('opt-careful', '谨慎评估后再行动', 'safe', { attributes: { intelligence: 2, luck: 1 } }),
    opt('opt-share', '和身边人一起庆祝', 'relationship', { attributes: { charm: 2 } }),
  ], '有时候，生活比小说更温柔。'),

  ev('event-genius-awaken', 'highlight', 'any', '潜能觉醒', '某个瞬间，你发现自己对某件事有着超乎寻常的理解力。', [
    opt('opt-dive', '全身心投入这个领域', 'growth', { attributes: { intelligence: 3, resilience: 1 } }),
    opt('opt-balance', '在现有生活和热爱之间找平衡', 'safe', { attributes: { intelligence: 2, resilience: 1 } }),
    opt('opt-show', '找机会展示自己的能力', 'relationship', { attributes: { charm: 2, intelligence: 1 } }),
  ], '天赋需要被看见，更需要被滋养。'),

  ev('event-art-call', 'milestone', 'any', '艺术的召唤', '你偶然接触到一种艺术形式，内心被深深触动。', [
    opt('opt-pursue', '认真追求艺术道路', 'meaning', { attributes: { intelligence: 2, charm: 2 }, theme: 'art' }),
    opt('opt-hobby', '作为业余爱好坚持下去', 'growth', { attributes: { resilience: 2, charm: 1 } }),
    opt('opt-share-art', '创作作品分享给身边的人', 'relationship', { attributes: { charm: 3 } }),
  ], '艺术是灵魂的镜子。'),

  ev('event-volunteer-spark', 'milestone', 'any', '公益的火花', '一次偶然的志愿服务，让你意识到帮助他人的强烈满足感。', [
    opt('opt-commit-social', '把公益作为人生重要部分', 'meaning', { attributes: { charm: 2, resilience: 1 }, theme: 'social' }),
    opt('opt-occasional', '有空就参与', 'relationship', { attributes: { charm: 2 } }),
    opt('opt-profession', '考虑转行到公益领域', 'adventure', { attributes: { intelligence: 1, charm: 2 } }),
  ], '利他之心，是最高级的自我实现。'),

  ev('event-breather-nature', 'breather', 'any', '走进自然', '你感到压力巨大时，被朋友拉去郊外走走。风吹过树叶，你突然松了口气。', [
    opt('opt-regular', '决定定期去自然中恢复', 'growth', { attributes: { resilience: 2, physique: 1 } }),
    opt('opt-moment', '珍惜此刻的宁静', 'acceptance', { attributes: { resilience: 2 } }),
    opt('opt-invite', '以后带家人一起来', 'relationship', { attributes: { charm: 1, resilience: 1 } }),
  ], '自然是最好心理急救箱。'),

  ev('event-small-victory', 'highlight', 'any', '小小的胜利', '一件你一直害怕的事，今天终于完成了。它没有想象中可怕。', [
    opt('opt-celebrate', '好好奖励自己', 'acceptance', { attributes: { resilience: 2 }, perma: { positive: 1 } }),
    opt('opt-next', '趁热打铁挑战下一件事', 'growth', { attributes: { resilience: 1, intelligence: 1 } }),
    opt('opt-share-joy', '把喜悦分享给支持你的人', 'relationship', { attributes: { charm: 2 } }),
  ], '勇气不是不害怕，而是害怕也去做。'),

  ev('event-random-kindness', 'normal', 'any', '日行一善', '今天你有机会做一件很小但正确的事：帮邻居取快递，或者给外卖小哥递一瓶水。', [
    opt('opt-do-it', '毫不犹豫地去做', 'meaning', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-busy', '今天太忙，下次吧', 'safe', { attributes: { resilience: 1 } }),
    opt('opt-make-habit', '把 small kindness 变成习惯', 'growth', { attributes: { charm: 2, resilience: 1 } }),
  ], '善良不需要理由，它本身就是回报。'),

  // ===== 贵人事件 2 =====
  ev('event-meet-mentor', 'milestone', 'any', '遇见导师', '在一次分享会上，一位前辈听完你的想法后，主动邀请你喝咖啡聊聊。', [
    opt('opt-accept-guidance', '虚心请教，并保持联系', 'growth', {
      attributes: { intelligence: 2, resilience: 1 },
      addHelper: {
        id: 'helper-mentor-chen',
        name: '陈导师',
        role: 'mentor',
        description: '在你迷茫时给予关键建议的导师，能解锁更深层的人生事件。',
        unlockEventIds: [],
      },
    }),
    opt('opt-thank-later', '感谢名片，暂时不打扰', 'safe', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-ask-specific', '请对方在你关键节点给建议', 'relationship', {
      attributes: { charm: 2 },
      addHelper: {
        id: 'helper-mentor-chen',
        name: '陈导师',
        role: 'mentor',
        description: '在你迷茫时给予关键建议的导师，能解锁更深层的人生事件。',
        unlockEventIds: [],
      },
    }),
  ], '人生需要一位相信你比你相信自己更多的人。', { minAge: 16, maxAge: 45 }),

  ev('event-unexpected-friend', 'normal', 'any', '意外的同盟', '你遇到了一个和你处境相似的人，你们很快成为互相支持的伙伴。', [
    opt('opt-trust', '真心相待，互相支持', 'relationship', {
      attributes: { charm: 2, resilience: 1 },
      addHelper: {
        id: 'helper-friend-xiaobei',
        name: '小北',
        role: 'friend',
        description: '与你并肩同行的挚友，低谷时会拉你一把。',
        unlockEventIds: [],
      },
    }),
    opt('opt-keep-light', '轻松相处，不互相添负担', 'safe', { attributes: { charm: 1, resilience: 1 } }),
    opt('opt-grow-together', '约定一起成为更好的人', 'growth', {
      attributes: { resilience: 2 },
      addHelper: {
        id: 'helper-friend-xiaobei',
        name: '小北',
        role: 'friend',
        description: '与你并肩同行的挚友，低谷时会拉你一把。',
        unlockEventIds: [],
      },
    }),
  ], '真正的友谊是彼此见证成长。', { minAge: 12 }),
]

export function getEventById(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id)
}

export function getEventsByStage(stage: LifeStage | 'any'): GameEvent[] {
  return EVENTS.filter((e) => e.stage === stage || e.stage === 'any')
}

export function countEventsByType(): Record<GameEvent['type'], number> {
  return EVENTS.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    },
    {} as Record<GameEvent['type'], number>
  )
}
