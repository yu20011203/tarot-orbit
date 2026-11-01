(function (global) {
  "use strict";

  const domains = {
    career: {
      label: "事业与成长",
      short: "事业 / 学业",
      keywords: [
        "工作", "事业", "职业", "职场", "面试", "求职", "跳槽", "升职", "加薪",
        "同事", "老板", "领导", "项目", "创业", "公司", "客户", "合作", "团队",
        "学业", "学习", "考试", "考研", "考公", "留学", "毕业", "论文", "学校",
        "专业", "offer", "offer选择", "实习", "转行", "副业", "辞职", "自由职业"
      ],
      premise: "这不是只看“结果好不好”的问题，更要看你的目标、可调动资源、边界与投入节奏。",
      closing: "先确认你愿意长期承担什么，再决定这一次往哪里用力。",
      theme: "先厘清目标与代价",
      lens: {
        past: "回看过去的工作或学习节奏，确认哪些选择仍在影响今天的投入。",
        present: "观察当前的资源、边界与行动方式，而不只盯着一个结果。",
        future: "把你真正想要的位置，与必须承担的代价放在一起衡量。"
      },
      actions: [
        "把“我想要什么、我愿意付出什么、我不能牺牲什么”分别写成三条。",
        "为最重要的一件事设定本周可交付的小结果，不再同时推进所有方向。",
        "在重要沟通里少说笼统的“再看看”，改成明确的时间、范围和下一步。"
      ],
      nowAction: "在 24 小时内写下一页纸：目标、代价、底线各一条；然后只做其中一个 30 分钟动作。"
    },
    love: {
      label: "关系与情感",
      short: "关系 / 情感",
      keywords: [
        "感情", "爱情", "恋爱", "喜欢", "暗恋", "对象", "前任", "分手", "复合",
        "暧昧", "婚姻", "结婚", "伴侣", "男朋友", "女朋友", "老公", "老婆", "他", "她",
        "对方", "我们", "关系", "相处", "约会", "表白", "家庭", "家人", "亲子"
      ],
      premise: "重点不在于猜测对方，而在于辨认彼此的需求、边界，以及愿意兑现的行动。",
      closing: "比起追问一个确定答案，更重要的是确认这段关系是否让你更完整、更安全。",
      theme: "让真实需要进入对话",
      lens: {
        past: "回看这段关系里已经形成的相处模式，以及当时没有被说出口的需要。",
        present: "把注意力放回感受、边界和事实，减少用猜测填补空白。",
        future: "看行动是否与承诺一致，而不是只看一时的情绪浓度。"
      },
      actions: [
        "把“对方会不会……”改成“我希望的关系具体是什么样”，先认清自己的需要。",
        "用一次平静而具体的对话确认事实，不用试探、冷处理或反复猜想来代替沟通。",
        "观察持续的行动，而不是只听一次性的漂亮承诺；也保留自己的节奏和边界。"
      ],
      nowAction: "等情绪平稳后，用“我感到……我需要……你愿意……”的句式，向对方提出一个具体、可回答的问题。"
    },
    wealth: {
      label: "金钱与资源",
      short: "财务 / 资源",
      keywords: [
        "钱", "金钱", "财务", "财富", "收入", "工资", "奖金", "投资", "理财",
        "股票", "基金", "债务", "还债", "贷款", "买房", "房产", "消费", "预算",
        "经济", "生意", "盈利", "成本", "存款", "储蓄", "报价", "报酬", "现金流"
      ],
      premise: "牌面更适合用来检查现金流、风险承受度与决策习惯，而不是预测某一笔收益。",
      closing: "先稳住可承受的下限，再谈更大的增长；任何具体投资都应回到真实数据与专业意见。",
      theme: "先稳住资源再扩大",
      lens: {
        past: "回看过去的收支习惯与风险判断，找出反复出现的选择模式。",
        present: "把真实数字、时间成本与风险摆上桌面，不靠焦虑做决定。",
        future: "优先考虑可持续性与安全边际，而不是被短期收益牵着走。"
      },
      actions: [
        "列出最近 30 天的收入、固定支出和可调整支出，先看清现金流。",
        "给这次决定设置止损线与等待期，避免在情绪高点一次性押注。",
        "涉及投资、税务或债务时，把牌面当作整理问题的工具，并咨询有资质的专业人士。"
      ],
      nowAction: "今天核对一次真实账目，圈出三项可延后支出，并为本周设一个你愿意执行的预算上限。"
    },
    growth: {
      label: "自我与方向",
      short: "自我 / 选择",
      keywords: [
        "选择", "方向", "人生", "未来", "改变", "成长", "自我", "迷茫", "决定",
        "坚持", "放下", "离开", "搬家", "旅行", "留学",
        "价值", "意义", "目标", "习惯", "勇气", "内耗", "纠结"
      ],
      premise: "这不是让别人替你选答案的问题，而是把价值排序、隐藏成本与下一步摊开。",
      closing: "真正的方向感通常来自行动后的反馈，而不是继续在脑中寻找一个完美答案。",
      theme: "把模糊不安变成可验证的选择",
      lens: {
        past: "回看你曾经如何做决定，哪些经验让你更谨慎，也哪些惯性正在限制你。",
        present: "先辨认你真正重视什么，再判断眼前选项是否服务于这些价值。",
        future: "用一次小规模试验换取真实反馈，让下一步由事实而不是恐惧决定。"
      },
      actions: [
        "把选择缩成两个可比较的方向，各写下一年后的收益、代价和不可逆部分。",
        "给犹豫设一个期限；期限内只收集关键信息，到期后必须做一个可撤回的小决定。",
        "把“我要变得更好”改写成今天能观察的行为，例如预约、询问、提交或拒绝。"
      ],
      nowAction: "选一个 7 天可完成的小实验，只验证一个关键假设；用结果更新你的判断，而不是继续空想。"
    },
    health: {
      label: "身心与状态",
      short: "身心 / 状态",
      keywords: [
        "健康", "身体", "睡眠", "失眠", "疲惫", "焦虑", "压力", "情绪", "生病",
        "疾病", "健身", "饮食", "作息", "心理", "抑郁", "疼痛", "恢复", "精力",
        "倦怠", "放松", "疗愈"
      ],
      premise: "这里更重要的是查看能量负荷、生活节奏和可获得的现实支持，牌面不能替代专业诊断。",
      closing: "先照顾身体与情绪的基本盘；持续的不适、疼痛或情绪困扰，应及时寻求医生或心理咨询师帮助。",
      theme: "先恢复能量再处理噪音",
      lens: {
        past: "回看近期压力从哪里累积，身体和情绪是否早就在发出提醒。",
        present: "减少额外消耗，先观察睡眠、饮食、活动量和支持系统。",
        future: "把恢复当成需要持续安排的事情，而不是等耗尽后再补救。"
      },
      actions: [
        "先记录一周的睡眠、饮食、活动与情绪，用事实判断负荷，而不是只凭一天的感受。",
        "今天减少一项非必要消耗，并为休息预留一个不可被轻易占用的时间段。",
        "若不适持续、明显影响生活，请及时咨询医生或专业心理支持，不要只依赖解读。"
      ],
      nowAction: "先完成今天最基本的三件事：喝水、吃一顿稳定的饭、给自己 20 分钟不被打扰的休息。"
    },
    general: {
      label: "综合议题",
      short: "开放问题",
      keywords: [],
      premise: "牌面把问题拆成来路、当下与可选择的下一步，重点在于看见你真正能影响的部分。",
      closing: "答案不是一句固定的预言，而是你在看清代价与需要之后，愿意做出的那个具体选择。",
      theme: "整理线索并选择一个下一步",
      lens: {
        past: "回看事情如何走到今天，辨认仍在起作用的经验与惯性。",
        present: "分清事实、感受和猜测，把注意力放到当下可影响的部分。",
        future: "把未来当作一种趋势而非定数，用接下来的行动继续改写它。"
      },
      actions: [
        "写下你最在意的三个问题，并区分哪些已有事实、哪些只是担忧。",
        "只挑一个 48 小时内能完成的小动作，先换取真实反馈。",
        "给这次思考设一个停止点，避免无限分析替代真正的决定。"
      ],
      nowAction: "在 48 小时内完成一个成本很低、可撤回的小尝试，用真实反馈替代反复猜测。"
    }
  };

  const answerProfiles = {
    career: {
      headline: "先稳住基本盘，再用结果决定是否加码",
      verdict: "这组牌更适合你一边守住现有资源、一边验证下一步，而不是只凭一时不满突然换轨。先选一个能积累经验、有人协作且边界清楚的方向；信息不足时，不要用不可逆的选择换取短暂解脱。",
      reasonLead: "你接下来能不能走稳，取决于目标是否清楚、资源能否持续，而不只是眼前机会看起来够不够大。",
      keyPoints: ["目标优先", "先小步验证", "再决定加码"]
    },
    cityCareer: {
      headline: "优先去有熟人网络、社群活跃的一线或新一线城市",
      verdict: "你更适合去成都、杭州、深圳这类年轻人聚集、行业圈子和社群氛围更活跃的城市；最好是那里已经有朋友、前同事或熟人能搭把手。不建议为了“换个环境”去一个完全陌生、没有社交依托的小城市。",
      reasonLead: "你接下来的工作机会和状态，很大程度取决于身边有没有能搭把手、能一起活动的人。",
      keyPoints: ["圈子优先", "先有人再选城", "热闹也要留退路"],
      useKeyPointsAsIs: true
    },
    love: {
      headline: "先确认需要，再用行动决定关系走向",
      verdict: "这组牌更支持你把真实需要摆到台面上，再根据对方持续的行动决定要不要继续加深投入。可以继续靠近，但不建议靠试探、猜测或一次情绪高点替关系下结论。",
      reasonLead: "关系能不能走远，重点不在一次情绪的高低，而在双方是否愿意回应彼此的需要和边界。",
      keyPoints: ["需要优先", "看持续行动", "再决定去留"]
    },
    wealth: {
      headline: "先守住安全边际，再谈增长",
      verdict: "这组牌更适合先整理现金流、守住下限，再做小规模、可承受的尝试，而不是在焦虑里一次性押注。先问自己最坏情况下是否仍然安全，再考虑要不要增加投入。",
      reasonLead: "你现在的重点不是猜一个涨跌结果，而是确认风险、时间和现金回笼能力是否真的承受得住。",
      keyPoints: ["守住下限", "核对真实数字", "再谈收益"]
    },
    growth: {
      headline: "先做低成本试验，再决定要不要押上更多",
      verdict: "这个方向可以试，但更适合先用一个 7 天左右的小实验验证，而不是一次切断所有退路。让真实反馈参与决定，比继续在脑内反复比较更有效。",
      reasonLead: "你真正需要的是更多有效反馈，而不是另一个看似完美、却还没有被执行过的答案。",
      keyPoints: ["先做实验", "收集真实反馈", "再定长期方向"]
    },
    health: {
      headline: "先减负恢复，再处理其他问题",
      verdict: "这组牌更建议你先把节奏慢下来、减少持续消耗，再处理其他决定。休息、睡眠、饮食和现实支持应当排在意志力之前；持续或明显的不适，需要及时寻求专业帮助。",
      reasonLead: "身体与情绪的信号通常不是靠硬撑消失的，先降低负荷，才有空间看清真正需要调整的部分。",
      keyPoints: ["先减少消耗", "稳定基本节奏", "必要时求助"]
    },
    general: {
      headline: "先把问题收窄，再做一个可验证的下一步",
      verdict: "现在不必急着逼出一个绝对答案。这组牌更支持你先分清事实、感受与猜测，只处理当下能影响的部分，用一次小行动换取新的信息。",
      reasonLead: "答案通常不是继续空想出来的，而是在你做出一个小而真实的动作之后逐渐变得清楚。",
      keyPoints: ["区分事实与担忧", "只改一个环节", "用行动换反馈"]
    }
  };

  const positions = {
    past: {
      label: "过去",
      frame: "这次议题的来路"
    },
    present: {
      label: "现在",
      frame: "当下正在发生的能量"
    },
    future: {
      label: "未来",
      frame: "延续当前节奏时更靠近的方向"
    }
  };

  const suits = {
    wands: {
      name: "权杖",
      element: "火",
      theme: "行动、热情与创造",
      focus: "行动意愿与推进节奏",
      gift: "主动、勇气和把事情做起来的能量",
      shadow: "急躁、逞强或过度消耗",
      action: "把热情落到一个今天能开始的动作上，并给节奏留出余量。"
    },
    cups: {
      name: "圣杯",
      element: "水",
      theme: "情感、直觉与关系",
      focus: "真实感受与关系连接",
      gift: "共情、想象力与倾听内心的能力",
      shadow: "情绪淹没、理想化或回避现实",
      action: "先把感受说清楚，再用事实和边界保护这段连接。"
    },
    swords: {
      name: "宝剑",
      element: "风",
      theme: "思考、沟通与抉择",
      focus: "信息判断与沟通边界",
      gift: "清晰、诚实与切开问题的能力",
      shadow: "过度分析、言语冲突或自我设限",
      action: "把事实、假设和担忧分开写，再决定要沟通或放下的部分。"
    },
    pentacles: {
      name: "星币",
      element: "土",
      theme: "资源、工作与现实",
      focus: "时间、身体、金钱与可持续性",
      gift: "耐心、务实和把计划落地的能力",
      shadow: "过度保守、物质焦虑或只盯着得失",
      action: "回到预算、时间表和身体状态，用具体数字与现实步骤稳定局面。"
    }
  };

  const ranks = {
    1: { name: "王牌 / 一", stage: "萌芽", text: "一个尚未定型的开始，重点是抓住最初的火花。" },
    2: { name: "二", stage: "平衡与对照", text: "两个方向或力量需要被放在一起权衡。" },
    3: { name: "三", stage: "发展与协作", text: "事情开始生长，合作和外部回应变得重要。" },
    4: { name: "四", stage: "稳定与结构", text: "需要建立边界、秩序或一个可持续的根基。" },
    5: { name: "五", stage: "变动与挑战", text: "摩擦揭示失衡之处，也迫使人重新选择。" },
    6: { name: "六", stage: "调和与过渡", text: "能量开始流动，适合修复、交换与向前移动。" },
    7: { name: "七", stage: "评估与策略", text: "需要判断投入是否值得，并调整方法。" },
    8: { name: "八", stage: "精进与推进", text: "行动或学习进入反复练习、加速推进的阶段。" },
    9: { name: "九", stage: "接近完成", text: "已经累积很多，也接近承受极限，需要整合剩余能量。" },
    10: { name: "十", stage: "完成与结果", text: "一个周期来到收束点，下一步要处理承担与传承。" },
    11: { name: "侍从", stage: "学习与试探", text: "新的消息、好奇心与初学者姿态正在出现。" },
    12: { name: "骑士", stage: "追击与推进", text: "能量朝目标快速移动，考验的是方向与节奏。" },
    13: { name: "王后", stage: "内在掌握", text: "通过成熟的内在品质影响局面，而不必靠强硬控制。" },
    14: { name: "国王", stage: "外在领导", text: "需要承担决策与领导责任，也要防止权力固化。" }
  };

  const rev = (keywords, meaning, advice) => ({ keywords, meaning, advice });

  const major = {
    "major-00": {
      keywords: ["新的开始", "冒险", "纯真", "自由"],
      meaning: "一段尚未被经验框住的新旅程正在出现。它鼓励你带着好奇出发，也提醒你别把天真误当成没有风险。",
      advice: "先用一个低成本的小尝试验证方向，再决定是否纵身一跃。",
      reversed: rev(["鲁莽", "逃避责任", "准备不足"], "能量受阻时，可能表现为冲动出发、忽略风险，或用“自由”逃避承诺。", "先补齐底线与关键信息，再决定是否行动。")
    },
    "major-01": {
      keywords: ["创造力", "意志", "资源", "行动"],
      meaning: "你已经拥有可调用的工具、信息与能力，关键在于把想法转成清晰、连贯的行动。",
      advice: "列出手里已有的三项资源，并今天就使用其中一项。",
      reversed: rev(["操控", "分散", "才能浪费"], "资源与能力没有朝同一个目标流动，也可能出现承诺大于行动、技巧被误用的情况。", "收窄目标，先兑现一个小承诺，用结果重新建立信任。")
    },
    "major-02": {
      keywords: ["直觉", "潜意识", "静默", "智慧"],
      meaning: "答案暂时藏在信息与情绪之下。现在更需要安静观察，而不是为了缓解不安而仓促表态。",
      advice: "给自己一个不被打扰的观察期，把直觉与事实分别记录下来。",
      reversed: rev(["忽视直觉", "信息封闭", "内在噪音"], "外界的期待盖过了内心的声音，或者你正在回避一个已经隐约知道的事实。", "减少噪音，核对被忽略的细节，再决定是否继续等待。")
    },
    "major-03": {
      keywords: ["丰盛", "滋养", "创造", "美"],
      meaning: "事情有被滋养和生长的空间。它也可能提醒你检查付出是否平衡，避免照顾别人时耗空自己。",
      advice: "先补足自己的能量，再把照顾与创造分享出去。",
      reversed: rev(["过度付出", "匮乏感", "创造停滞"], "照顾与创造的能量失衡，可能因害怕不够而抓得太紧，或为了别人长期忽略自己。", "重新分配时间与照顾，先满足最基本、最真实的需要。")
    },
    "major-04": {
      keywords: ["秩序", "边界", "权威", "稳定"],
      meaning: "局面需要清楚的结构、规则和责任人。稳定并非控制一切，而是建立可预期的边界。",
      advice: "把权责、底线和时间范围说明白，减少靠猜测维持秩序。",
      reversed: rev(["专横", "僵化", "控制过度"], "规则可能变成了压迫，或者你正用强硬掩盖内在的不安全感。", "松开不必要的控制，保留真正重要的底线。")
    },
    "major-05": {
      keywords: ["传统", "信念", "学习", "指引"],
      meaning: "你正在面对一套既有规则、价值体系或来自前辈的建议。它可以是资源，也需要经过自己的判断。",
      advice: "先理解规则为何存在，再决定哪些要遵循、哪些要更新。",
      reversed: rev(["教条", "盲从", "价值冲突"], "外部标准与内在价值发生冲突，也可能是为了反抗而反抗。", "区分“应该”与“真正认同”，用行动验证自己的价值排序。")
    },
    "major-06": {
      keywords: ["选择", "结合", "价值观", "坦诚"],
      meaning: "真正重要的不是表面吸引，而是价值观是否一致、双方能否坦诚承担选择。",
      advice: "把选择背后的价值排序写出来，再观察行动是否和承诺一致。",
      reversed: rev(["关系失衡", "犹豫", "价值分歧"], "选择被恐惧或期待拖着走，关系里可能存在没有被说清楚的失衡。", "先承认分歧，再决定能否协商；不要用讨好换稳定。")
    },
    "major-07": {
      keywords: ["意志", "推进", "胜利", "方向"],
      meaning: "局面需要集中意志向前推进。真正的胜利来自方向清楚、节奏稳定，而不是一味加速。",
      advice: "确定唯一优先目标，把最容易分散注意力的事项暂时放下。",
      reversed: rev(["失控", "方向混乱", "强行推进"], "用力没有集中在正确方向，可能出现急躁、较劲或过度掌控。", "先停下来校准方向和资源，再决定下一步的速度。")
    },
    "major-08": {
      keywords: ["勇气", "温柔的力量", "耐心", "自我掌握"],
      meaning: "力量不只是强硬，而是能稳住情绪、承认恐惧，并用耐心驯服冲动。",
      advice: "面对最难的部分时，先降低声量和速度，用稳定行动代替硬碰硬。",
      reversed: rev(["自我怀疑", "冲动", "内在失序"], "情绪或本能占了上风，也可能是你太怕失败而不敢承担。", "先照顾好生理状态，再处理冲突；不要在失控时做最终决定。")
    },
    "major-09": {
      keywords: ["内省", "独处", "寻找", "智慧"],
      meaning: "你需要暂时离开外界噪音，独自确认什么才是真正重要的。独处是寻找，不必等同于孤立。",
      advice: "安排一段真正的安静时间，但给这段独处设一个回到行动的期限。",
      reversed: rev(["孤立", "逃避", "固步自封"], "独处可能变成了隔绝，或者你不断向内寻找却不给外界一个回应。", "保留必要联系，选一个可信任的人说出真实状态。")
    },
    "major-10": {
      keywords: ["转折", "循环", "时机", "变化"],
      meaning: "局面正在进入新的周期。你可以影响如何回应变化，却无法让所有事情都按原计划停在原地。",
      advice: "识别已经出现的变化信号，提前准备能让你抓住下一轮机会的动作。",
      reversed: rev(["抗拒变化", "循环困局", "时机未到"], "你可能在重复熟悉的模式，或因为害怕失去而拒绝已经发生的改变。", "找出循环里最可控的一环，先改掉一个反复出现的反应。")
    },
    "major-11": {
      keywords: ["公正", "真相", "因果", "责任"],
      meaning: "事实、规则与责任需要被认真面对。清楚衡量各方代价，比追求一个让所有人都满意的答案更重要。",
      advice: "把事实、责任和边界逐条列出，再做决定；不要用模糊来逃避承担。",
      reversed: rev(["失衡", "偏颇", "逃避责任"], "利益或情绪让判断失衡，可能只看见对自己有利的那一面。", "请一位相对中立的人帮你核对事实，并明确自己要承担的部分。")
    },
    "major-12": {
      keywords: ["换位", "等待", "暂停", "放下"],
      meaning: "暂时停下来并非失败，而是换一个角度。只有愿意放下原有执念，新的理解才有空间出现。",
      advice: "把问题倒过来问一次：如果不再证明自己是对的，我会怎么选？",
      reversed: rev(["拖延", "无谓牺牲", "困在僵局"], "等待已失去意义，或者你不断牺牲却说不清为了什么。", "给等待设定截止点，明确哪些牺牲已经不再值得。")
    },
    "major-13": {
      keywords: ["结束", "蜕变", "告别", "重生"],
      meaning: "某个阶段需要真正结束，新东西才可能长出来。这不是单纯的失去，而是清理不再适用的部分。",
      advice: "承认已经结束的部分，为它做一次清晰收尾，再把精力留给新的阶段。",
      reversed: rev(["抗拒结束", "恐惧改变", "停在旧模式"], "你知道该结束，却仍在拖延或反复回到旧关系、旧做法。", "先完成一个象征性收尾动作，再为新的生活腾出实际空间。")
    },
    "major-14": {
      keywords: ["平衡", "调和", "耐心", "适度"],
      meaning: "不同力量正在寻找可共存的比例。急于求成会破坏平衡，耐心的调整反而更快。",
      advice: "把极端选项先放下，寻找一个可以持续 30 天的小比例方案。",
      reversed: rev(["失衡", "过度", "缺乏耐心"], "节奏、情绪或投入比例失调，可能是过度用力，也可能是完全放任。", "先减掉一个过量项，再加入一个能长期坚持的小习惯。")
    },
    "major-15": {
      keywords: ["束缚", "欲望", "诱惑", "阴影"],
      meaning: "某样东西拥有过大的控制力，可能是欲望、依赖、恐惧或一段不健康的关系。看见锁链是松开的开始。",
      advice: "找出你最难拒绝的那件事，诚实评估它带来的短期安慰与长期代价。",
      reversed: rev(["看见依赖", "试图挣脱", "旧模式反复"], "你开始看见束缚，但改变仍在拉扯中；也可能用新的依赖替换旧的依赖。", "建立具体边界与替代行为，必要时寻求专业支持。")
    },
    "major-16": {
      keywords: ["剧变", "旧结构崩塌", "真相", "觉醒"],
      meaning: "建立在脆弱基础上的结构正在松动。冲击令人不适，却也暴露出必须重建的部分。",
      advice: "先做风险预案，停止给已经失效的结构继续补补丁。",
      reversed: rev(["恐惧改变", "延迟的崩塌", "压抑"], "你预感结构不稳，却因害怕损失而继续拖延，压力可能因此累积。", "提前做减法与安全预案，让改变以更可控的方式发生。")
    },
    "major-17": {
      keywords: ["希望", "疗愈", "灵感", "指引"],
      meaning: "经历过消耗之后，希望和修复正在重新出现。它不要求你立刻乐观，只需要保留一点向前看的空间。",
      advice: "恢复一个能让你感觉更有生命力的小习惯，让希望从具体小事里长出来。",
      reversed: rev(["失望", "信心不足", "连接中断"], "你可能暂时看不见希望，或把疗愈想成必须马上完成的任务。", "把目标缩小到今天能照顾自己的一个动作，不强迫自己立刻振作。")
    },
    "major-18": {
      keywords: ["幻象", "不安", "潜意识", "直觉"],
      meaning: "信息并不完整，情绪与想象会放大不确定感。先别急着把猜测当成事实。",
      advice: "把担心的内容写成事实、推测、感受三栏，逐项核对。",
      reversed: rev(["真相浮现", "焦虑缓解", "逐渐清醒"], "迷雾开始散开，但仍需要时间消化已经看见的部分。", "继续核对信息，给情绪一点缓冲，不要立刻做过大的承诺。")
    },
    "major-19": {
      keywords: ["成功", "喜悦", "活力", "坦诚"],
      meaning: "事情有清晰、公开、向前发展的空间。坦然表达和共享成果会让好运更容易被接住。",
      advice: "让成果被看见，也把注意力从证明自己转到真正享受正在发生的事。",
      reversed: rev(["短暂阴霾", "过度乐观", "延迟"], "结果可能没有想象中顺利，或者你把表面热闹误当成了真正进展。", "核对实际进度与承诺，不用夸张叙事掩盖小问题。")
    },
    "major-20": {
      keywords: ["觉醒", "召唤", "复盘", "重生"],
      meaning: "一个更清楚的自我认识正在浮现，你被邀请回应内心真正的召唤，而不只是重复过去。",
      advice: "回看一次关键经历：它反复教给你的功课是什么？现在可以作出什么不同回应？",
      reversed: rev(["逃避召唤", "自我怀疑", "无法释怀"], "你知道变化需要发生，却仍在等待一个不会再来的完美时机。", "先原谅当时没有做到的自己，再做今天能做的那个不同选择。")
    },
    "major-21": {
      keywords: ["完成", "圆满", "整合", "达成"],
      meaning: "一个周期正在完成，经验需要被整合。真正的圆满不是完美无缺，而是能够承认全过程并继续前行。",
      advice: "为已经完成的部分做一次复盘和庆祝，然后确认下一个周期要从哪里开始。",
      reversed: rev(["未完成", "缺少闭环", "停滞"], "还差一个收尾、承认或整合的动作，事情因此迟迟无法真正进入下一章。", "找到最后那个未完成的动作，把它缩小到今天就能推进的一步。")
    }
  };

  const minorData = {
    wands: [
      { keywords: ["灵感", "启动", "可能性"], meaning: "一束新的热情或创意正在出现，适合把想法变成第一次行动。", advice: "先把想法做成一个最小版本，不必等到万事俱备。" },
      { keywords: ["规划", "远见", "选择方向"], meaning: "站在门槛上规划下一步，需要在现有条件与更大愿景之间做取舍。", advice: "写下未来三步，并标出第一步真正需要的资源。" },
      { keywords: ["扩张", "等待回报", "视野打开"], meaning: "前期投入开始显现可能，格局正在变大，但结果仍需要时间兑现。", advice: "保持节奏，同时为外部变化预留调整空间。" },
      { keywords: ["庆祝", "稳定", "归属"], meaning: "阶段性成果与安定感值得被看见，也适合建立可持续的根基。", advice: "先承认已经完成的部分，再安排下一段节奏。" },
      { keywords: ["竞争", "摩擦", "表达立场"], meaning: "不同意见与资源争夺带来摩擦，考验你如何表达立场又不失分寸。", advice: "把人和问题分开，先定义共同目标，再谈具体分歧。" },
      { keywords: ["胜利", "认可", "协作"], meaning: "努力获得回应，团队协作与公开表达能带来明显进展。", advice: "让成果被看见，同时把功劳分给真正参与的人。" },
      { keywords: ["坚守", "压力", "边界"], meaning: "你处在需要守住立场与底线的阶段，外部压力会检验这件事是否值得继续。", advice: "删掉无效消耗，只保留最核心的三条原则。" },
      { keywords: ["速度", "讯息", "推进"], meaning: "事情会加快，信息与机会快速流动，适合果断行动。", advice: "先确认消息真实与优先级，再快速推进关键一步。" },
      { keywords: ["坚持", "疲惫", "最后一程"], meaning: "你已经走了很远，也接近极限；胜利需要更聪明地分配剩余精力。", advice: "减少同时进行的事项，把力气留给最后一击。" },
      { keywords: ["责任", "完成", "重担"], meaning: "一个阶段接近完成，但责任与期待同时变重，需要重新定义承担方式。", advice: "分清必须承担与习惯性包揽，给责任设边界。" },
      { keywords: ["好奇", "学习", "新消息"], meaning: "一份新的热情、消息或学习机会出现了，适合以开放心态试探。", advice: "先了解、体验和提问，不必急着证明自己已经擅长。" },
      { keywords: ["行动", "追求", "冒险"], meaning: "强烈的行动冲动推动你向目标进发，速度和勇气是优势，方向同样重要。", advice: "出发前确认目的地和风险，再保持持续推进。" },
      { keywords: ["自信", "感染力", "带领"], meaning: "你或身边某个人正在用热情与自信影响局面，适合主动承担表达与带领的角色。", advice: "把感染力用在清楚传达愿景，也给其他人留下发言空间。" },
      { keywords: ["愿景", "领导", "创业精神"], meaning: "成熟的行动力与领导力正在被需要，重点是看见全局并把愿景转成方向。", advice: "定下长期方向，同时授权他人处理具体细节。" }
    ],
    cups: [
      { keywords: ["情感萌芽", "直觉", "接纳"], meaning: "新的情感流动或内心感受正在出现，值得被温柔地看见。", advice: "先承认自己的感受，不必立刻定义它代表什么。" },
      { keywords: ["共鸣", "结合", "互惠"], meaning: "两股能量之间出现连接与互相回应，关系有机会更进一步。", advice: "用真实表达回应连接，同时确认双方是否都愿意投入。" },
      { keywords: ["庆祝", "友谊", "分享"], meaning: "分享与陪伴带来滋养，适合庆祝阶段性成果、修复关系或建立支持网络。", advice: "主动邀请值得信任的人共享喜悦，不要把感受全部独自消化。" },
      { keywords: ["倦怠", "反思", "边界"], meaning: "对现状感到疲倦或失去兴趣，提醒你重新评估哪些投入已经不合适。", advice: "先停止自动重复，给自己一段安静评估的时间。" },
      { keywords: ["失落", "遗憾", "看见剩余"], meaning: "失去和遗憾需要被承认，但画面里仍有没有被完全拿走的部分。", advice: "允许自己哀伤，同时列出仍然存在、值得珍惜的资源。" },
      { keywords: ["怀旧", "纯真", "故人"], meaning: "过去的记忆、熟悉的人或单纯的心意重新出现，提醒你看见曾经滋养自己的东西。", advice: "回忆可以带来线索，但不要把过去美化成逃避当下的出口。" },
      { keywords: ["选择过多", "幻想", "聚焦"], meaning: "看似有很多方向，真正困难的是辨认哪一个值得投入。", advice: "限时收集信息，然后只保留两个最重要的判断标准。" },
      { keywords: ["放下", "离开", "更高召唤"], meaning: "某段情感或旧期待需要被放下，你才能走向更适合自己的方向。", advice: "承认离开的必要性，为这段经历做一个有意识的告别。" },
      { keywords: ["满足", "愿望", "享受"], meaning: "情感上的满足与愿望实现有机会出现，重点是允许自己真正接住。", advice: "接受已经到来的好，不用因为担心失去而提前否定它。" },
      { keywords: ["圆满", "家庭", "情感归宿"], meaning: "关系或情感周期走向完整，你更清楚什么会成为长期的支持。", advice: "把这份稳定转化成可持续的陪伴与共同生活安排。" },
      { keywords: ["敏感", "想象", "情感消息"], meaning: "更容易接收情绪与想象，也可能收到与关系有关的新消息。", advice: "把灵感记录下来，但用现实行动核对感受。" },
      { keywords: ["浪漫追求", "理想主义", "跟随内心"], meaning: "情感驱动力很强，容易为了心中的理想或浪漫投入。", advice: "跟随内心，同时为自己保留边界和可撤回的空间。" },
      { keywords: ["共情", "情绪容纳", "关系滋养"], meaning: "稳定的共情力能够承接关系里的复杂感受，也提醒你照顾自己的容量。", advice: "先辨认哪些情绪属于你、哪些属于对方，不必全部替别人承担。" },
      { keywords: ["情绪成熟", "稳重关怀", "外柔内定"], meaning: "成熟的情绪处理方式能带来安全感，关键在于稳定而非压抑。", advice: "用明确、温和而一致的态度表达边界和关心。" }
    ],
    swords: [
      { keywords: ["清晰", "真相", "突破"], meaning: "一束清晰的判断切开迷雾，适合把问题说清楚并做出决定。", advice: "用一句最直接的话写下真正的问题，再寻找事实依据。" },
      { keywords: ["僵持", "抉择", "左右为难"], meaning: "你正卡在两个立场或选择之间，持续拖延本身也是一种选择。", advice: "为两个选项各设一条可验证条件，限期决定是否继续。" },
      { keywords: ["心碎", "真相", "沟通"], meaning: "一个不得不面对的真相带来痛感，却也让人停止错误的想象。", advice: "先处理情绪，再沟通事实；不要在受伤时用攻击把对方推远。" },
      { keywords: ["休整", "恢复", "暂停"], meaning: "暂时退开、休息与整理思绪比继续消耗更有价值。", advice: "给自己一段明确的下线时间，停止反复查看和过度思考。" },
      { keywords: ["冲突", "胜负", "立场"], meaning: "争执容易升级为输赢之争，需要看清真正想保护的是什么。", advice: "把“我要赢”换成“我要解决什么”，再决定是否值得争。" },
      { keywords: ["过渡", "前行", "放下包袱"], meaning: "你正在离开一段充满紧张的状态，向更平稳的地方移动。", advice: "承认过去带来的经验，但不要把所有防备都带进下一步。" },
      { keywords: ["策略", "保留", "迂回"], meaning: "局面需要谨慎取舍信息与行动，不是所有想法都必须立刻公开。", advice: "保护底线信息，但也避免用隐瞒代替真实沟通。" },
      { keywords: ["束缚", "限制", "自我设限"], meaning: "限制感很多来自反复的假设与恐惧，实际可移动的空间可能比想象中大。", advice: "核对那些“我不能”的证据，挑一个最小限制做一次突破实验。" },
      { keywords: ["焦虑", "反复思考", "不眠"], meaning: "思绪在夜间被放大，担忧占据了过多注意力。", advice: "把担心写成可执行的问题或暂时搁置清单，避免在深夜做重大决定。" },
      { keywords: ["终结", "低谷", "黎明之前"], meaning: "一个艰难阶段已经走到尽头，但留下的是更能保护自己的经验。", advice: "允许这章结束，复盘一条最重要的教训，然后向前走。" },
      { keywords: ["求知", "观察", "直率"], meaning: "强烈的好奇心与敏锐观察力正在出现，也适合学习新的沟通方式。", advice: "多问一个关键问题，再表达判断；直率不等于不必顾及方式。" },
      { keywords: ["快速判断", "辩驳", "直接行动"], meaning: "思路和行动都很快，能够迅速推进，但容易忽略别人的感受。", advice: "在发出结论前留三秒，确认事实和语气是否都站得住。" },
      { keywords: ["边界", "理性沟通", "独立"], meaning: "清晰的边界与诚实的表达是当前的力量，不必讨好也能维持关系。", advice: "把界限说具体，并接受别人可能需要时间回应。" },
      { keywords: ["判断力", "规则", "策略"], meaning: "成熟的判断力适合处理复杂规则与长期策略，也提醒权力需要被约束。", advice: "先立规则再谈例外，确保决定对相关的人都可解释。" }
    ],
    pentacles: [
      { keywords: ["机遇", "务实开始", "资源"], meaning: "一个可以落地的机会出现，价值不在想象，而在是否开始培育。", advice: "把机会变成一份具体的行动清单或时间表。" },
      { keywords: ["平衡", "兼顾", "灵活调度"], meaning: "需要在多项责任之间找到动态平衡，不可能永远固定分配。", advice: "每周重新安排一次优先级，不要求自己同时完美完成所有事。" },
      { keywords: ["技艺", "协作", "精益求精"], meaning: "合作与专业能力可以让事情做得更稳，适合接受反馈并持续打磨。", advice: "找一位可信的人一起检查成果，把建议转成下一次改进。" },
      { keywords: ["守成", "紧握", "安全感"], meaning: "你想保护已有资源，但过度抓紧可能让机会和关系也停在原地。", advice: "分清必要储备与过度囤积，给真正重要的事留一点流动空间。" },
      { keywords: ["困顿", "扶持", "患难与共"], meaning: "现实上的紧绷需要被看见，也可能有人愿意提供实际支持。", advice: "先接受帮助并明确缺少什么，不必用独自硬撑证明能力。" },
      { keywords: ["给予", "收获", "资源流动"], meaning: "付出与回报开始形成更公平的交换，适合表达感谢与协商条件。", advice: "把贡献和回报摊开谈清楚，避免用默契掩盖不平衡。" },
      { keywords: ["耕耘", "等待", "积累"], meaning: "成果还没有成熟，但持续的投入正在积累，不适合频繁换来换去。", advice: "设定一个合理的观察周期，在周期内专注完成该做的部分。" },
      { keywords: ["精进", "专注", "磨练"], meaning: "把注意力放回一门技能或一件具体工作，重复练习会带来真正的进展。", advice: "减少同时进行的学习项目，只保留一项需要长期打磨的能力。" },
      { keywords: ["丰盛", "独立", "自给自足"], meaning: "你已经累积出一定的资源与能力，可以更稳定地选择自己的节奏。", advice: "享受成果，也留出一点空间继续成长，不必把自我价值只绑在产出上。" },
      { keywords: ["传承", "圆满", "长期成果"], meaning: "一个现实层面的周期走向完成，成果可能与家庭、事业或长期积累有关。", advice: "确认成果如何被保存和传承，并为自己安排新的长期方向。" },
      { keywords: ["务实学习", "新机会", "技能入门"], meaning: "一个实际的学习机会或工作起点正在出现，适合从基础开始。", advice: "先报一个具体课程、做一个小项目，用实际成果检验兴趣。" },
      { keywords: ["稳定推进", "勤奋", "可靠"], meaning: "缓慢但可靠的行动方式会带来进展，不需要靠一时的爆发证明自己。", advice: "把大任务拆成每天可完成的一段，坚持到可见结果。" },
      { keywords: ["资源管理", "照顾现实", "稳定滋养"], meaning: "你有能力把生活、金钱或工作安排得更有条理，也需要照顾自己的现实需求。", advice: "先整理最影响日常的一个现实系统，例如账目、作息或工作台。" },
      { keywords: ["长期建设", "财务成熟", "稳健领导"], meaning: "以长期视角承担资源与责任，重点是稳定、规则和可持续回报。", advice: "把决策放进一年两年的尺度检查，避免为短期体面承担长期负担。" }
    ]
  };

  const modeAdvice = {
    decision: "把“要不要”改成“在什么条件下要”；给两个选项分别写下可验证条件与止损线。",
    timing: "给问题一个明确时间窗；先决定这段时间要收集什么信息，而不是反复猜结果。",
    action: "把目标拆成一个今天就能开始、30 分钟内可完成的第一步。",
    explore: "继续观察，但给观察设期限；到期后必须做一次小决定或小实验。",
    relationship: "少猜对方怎么想，多用一次清晰、非指责的对话确认事实与需要。",
    general: "把注意力从不可控的结果，移动到下一步可观察的行动。"
  };

  const modeLabels = {
    decision: "取舍型问题",
    timing: "时机型问题",
    action: "行动型问题",
    explore: "理解型问题",
    relationship: "关系型问题",
    general: "开放型问题"
  };

  const domainQuestions = {
    career: [
      "这份工作或学习选择里，你最想保住的核心价值是什么？",
      "如果暂时不比较头衔、收入和别人的评价，你会怎样判断它值不值得继续？",
      "未来三个月，哪一个可交付的小成果最能帮你验证方向？"
    ],
    love: [
      "这段关系里，你反复压下、却一直没有被回应的需要是什么？",
      "你是在回应真实的对方，还是在回应你希望对方成为的样子？",
      "如果不再猜测对方，你希望双方用哪一个具体行动证明愿意投入？"
    ],
    wealth: [
      "如果最坏的结果发生，你的生活底线是否仍然安全？",
      "你现在的选择是在服务长期现金流，还是在缓解眼前的焦虑？",
      "哪些数字或事实必须在决定前被重新核对？"
    ],
    growth: [
      "你真正害怕失去的是机会，还是某个熟悉的自我形象？",
      "如果两个选项都不能让你完全不后悔，你更愿意承担哪一种代价？",
      "哪一个低成本试验能在七天内给你真实反馈？"
    ],
    health: [
      "最近的身体与情绪信号，分别是在提醒你减少什么、增加什么？",
      "你正在硬撑的事情里，哪一项其实可以暂时放下？",
      "谁或什么资源可以提供现实支持，而不是只靠意志力？"
    ],
    general: [
      "这件事里，哪些是事实，哪些只是担忧和猜测？",
      "你最想控制、却其实无法控制的部分是什么？",
      "如果只能改变一个当下可影响的小环节，你会选哪里？"
    ]
  };

  const modeQuestions = {
    decision: "两个选项各自最小的代价和不可逆部分是什么？",
    timing: "你要等的是更多信息，还是只是在回避作出选择？",
    action: "哪一个动作小到今天就能完成，却足以带来新信息？",
    explore: "如果暂时不需要一个答案，你最想更了解自己的哪一部分？",
    relationship: "如果不试探、不猜测，你能怎样直接而温和地确认需要？",
    general: "你愿意为下一步承担的最小责任是什么？"
  };

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "").replace(/其他/g, "");
  }

  function classifyDomain(question) {
    const text = normalize(question);
    let bestKey = "general";
    let bestScore = 0;
    let bestKeywords = [];

    Object.keys(domains).forEach(function (key) {
      if (key === "general") return;
      let score = 0;
      const matched = [];
      domains[key].keywords.forEach(function (keyword) {
        const k = normalize(keyword);
        if (k && text.indexOf(k) !== -1) {
          score += Math.max(2, Math.min(6, k.length));
          if (matched.indexOf(keyword) === -1) matched.push(keyword);
        }
      });
      if (score > bestScore) {
        bestKey = key;
        bestScore = score;
        bestKeywords = matched;
      }
    });

    return {
      key: bestKey,
      domain: domains[bestKey],
      score: bestScore,
      matched: bestKeywords
    };
  }

  function classifyMode(question, domainKey) {
    const q = String(question || "");
    if (domainKey === "love" && /关系|对方|他|她|我们|复合|分手|喜欢|感情/.test(q)) return "relationship";
    if (/该不该|要不要|是否能|能不能|可不可以|是否|还是|怎么选|如何选择|做不做|去不去/.test(q)) return "decision";
    if (/什么时候|多久|何时|时间|近期|这个月|今年|三个月|半年/.test(q)) return "timing";
    if (/为什么|意味着|代表什么|是什么|怎么理解/.test(q)) return "explore";
    if (/如何|怎么|怎样|该怎么办|该做什么|建议/.test(q)) return "action";
    return "general";
  }

  function selectAnswerProfile(question, domainKey) {
    const q = normalize(question);
    const isCityQuestion = domainKey === "career" &&
      /城市|去哪|哪里|哪个地方|地方|搬去|搬到| relocate|location/.test(q);
    return isCityQuestion
      ? answerProfiles.cityCareer
      : (answerProfiles[domainKey] || answerProfiles.general);
  }

  function getCard(file) {
    if (major[file]) {
      return Object.assign({ file: file, arcana: "major", suit: null }, major[file]);
    }
    const match = String(file || "").match(/^(wands|cups|swords|pentacles)-(\d{2})$/);
    if (!match) return null;
    const suitKey = match[1];
    const number = Number(match[2]);
    const item = minorData[suitKey] && minorData[suitKey][number - 1];
    if (!item) return null;
    const suit = suits[suitKey];
    const rank = ranks[number];
    return Object.assign({
      file: file,
      arcana: "minor",
      suit: suitKey,
      number: number,
      suitInfo: suit,
      rankInfo: rank
    }, item, {
      reversed: item.reversed || {
        keywords: [item.keywords[0] + "受阻", "能量失衡"],
        meaning: suit.shadow + "让这张牌的能量无法顺畅流动。先找出阻力，再谈推进。",
        advice: "先处理阻塞“" + item.keywords[0] + "”的现实原因，把一个动作做得更小、更具体。"
      }
    });
  }

  function countBy(items, keyGetter) {
    return items.reduce(function (acc, item) {
      const key = keyGetter(item);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function unique(items) {
    const seen = {};
    return items.filter(function (item) {
      const key = String(item || "").replace(/\s+/g, "");
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function cardKeywords(entry, count) {
    if (!entry || !entry.knowledge) return "";
    const card = entry.item.card || {};
    return (entry.knowledge.keywords || String(card.up || "").split("，"))
      .slice(0, count || 3)
      .join("、");
  }

  function transitionText(fromEntry, toEntry) {
    if (!fromEntry || !toEntry || !fromEntry.knowledge || !toEntry.knowledge) {
      return "两张牌共同提示：同一件事既有需要承接的旧经验，也有可以调整的新做法。";
    }

    const fromK = fromEntry.knowledge;
    const toK = toEntry.knowledge;
    const fromName = fromEntry.item.card.zh;
    const toName = toEntry.item.card.zh;
    const parts = [];

    if (fromK.arcana === "major" && toK.arcana === "major") {
      parts.push("两张都是大阿卡纳，说明这条线索牵动的是较长期的生命课题，而不是一次性的情绪起伏。");
    } else if (fromK.arcana === "major") {
      parts.push("议题从大阿卡纳的宏观课题，落到小阿卡纳所呈现的日常细节；你需要把抽象的方向感转成可执行的选择。");
    } else if (toK.arcana === "major") {
      parts.push("日常层面的细节在这里连接到更大的成长主题，眼前的小事可能正重复一个更长期的模式。");
    }

    if (fromK.arcana === "minor" && toK.arcana === "minor" && fromK.suitInfo && toK.suitInfo) {
      if (fromK.suit === toK.suit) {
        parts.push("两张牌都在" + toK.suitInfo.name + "，能量沿同一条线索延续：" + toK.suitInfo.theme + "会持续成为重点，同时也更容易暴露“" + toK.suitInfo.shadow + "”的盲点。");
      } else {
        parts.push("能量从" + fromK.suitInfo.name + "的“" + fromK.suitInfo.theme + "”转向" + toK.suitInfo.name + "的“" + toK.suitInfo.theme + "”；这说明只靠原来的处理方式不够，要把另一种能力也调动起来。");
      }
    }

    if (typeof fromK.number === "number" && typeof toK.number === "number") {
      if (toK.number > fromK.number) {
        parts.push(
          "牌阶从「" + fromK.rankInfo.stage + "」推进到「" + toK.rankInfo.stage + "」。" +
          fromK.rankInfo.text + " 接下来，" + toK.rankInfo.text
        );
      } else if (toK.number < fromK.number) {
        if (toK.number === 1) {
          parts.push(
            "牌阶从「" + fromK.rankInfo.stage + "」回到「萌芽」，像是一次回到原点的校准：" +
            "先重新确认最初的感受与需要，再决定接下来怎样继续。"
          );
        } else {
          parts.push(
            "牌阶从「" + fromK.rankInfo.stage + "」回到「" + toK.rankInfo.stage + "」，" +
            "提示需要收回过快的节奏，先补齐前一个阶段没有处理好的基础。"
          );
        }
      } else if (fromK.number >= 11) {
        parts.push("两张宫廷牌同时出现，人物的态度、角色与边界会比事件本身更关键。");
      }
    }

    if (!parts.length) {
      parts.push(fromName + "的“" + cardKeywords(fromEntry, 2) + "”与" + toName + "的“" + cardKeywords(toEntry, 2) + "”彼此映照：一个指出已经形成的惯性，另一个指出可以调整的方向。");
    }
    return parts.join("");
  }

  function buildCardPrompt(entry, positionKey) {
    const name = entry && entry.item.card ? entry.item.card.zh : "这张牌";
    const keyword = cardKeywords(entry, 2) || "当下";
    if (positionKey === "past") {
      return "过去你如何处理“" + keyword + "”这类课题？当时形成的保护方式，今天还在帮助你，还是也在限制你？";
    }
    if (positionKey === "present") {
      return "如果不急着解决，也不先猜别人怎么想，你现在最需要承认的事实或感受是什么？";
    }
    return "为了让" + name + "所提示的“" + keyword + "”走向更成熟的方向，你愿意先承担哪一个具体动作？";
  }

  function analyze(options) {
    const input = options || {};
    const question = String(input.question || "").trim();
    const drawn = Array.isArray(input.drawn) ? input.drawn.filter(function (item) {
      return item && item.card && item.pos;
    }) : [];
    if (drawn.length < 3) {
      return null;
    }

    const domainResult = classifyDomain(question);
    const domainKey = domainResult.key;
    const domain = domainResult.domain;
    const mode = classifyMode(question, domainKey);
    const cardInfos = drawn.slice(0, 3).map(function (item, index) {
      return {
        item: item,
        knowledge: getCard(item.card.file),
        positionKey: ["past", "present", "future"][index],
        position: item.pos
      };
    });

    const majorCount = cardInfos.filter(function (entry) {
      return entry.knowledge && entry.knowledge.arcana === "major";
    }).length;
    const minorEntries = cardInfos.filter(function (entry) {
      return entry.knowledge && entry.knowledge.arcana === "minor";
    });
    const courtCount = minorEntries.filter(function (entry) {
      return entry.knowledge.number >= 11;
    }).length;
    const suitCounts = countBy(minorEntries, function (entry) {
      return entry.knowledge.suit;
    });
    const suitOrder = Object.keys(suitCounts).sort(function (a, b) {
      if (suitCounts[b] !== suitCounts[a]) return suitCounts[b] - suitCounts[a];
      const priority = minorEntries.map(function (entry) { return entry.knowledge.suit; });
      return priority.indexOf(a) - priority.indexOf(b);
    });
    const dominantSuit = suitOrder[0] || (majorCount === 3 ? "major" : null);
    const dominantSuitInfo = suits[dominantSuit] || null;
    const elementParts = ["wands", "cups", "swords", "pentacles"].map(function (key) {
      return suitCounts[key] ? suits[key].element + " × " + suitCounts[key] : "";
    }).filter(Boolean);
    if (majorCount) elementParts.push("灵 × " + majorCount);

    const suitTheme = dominantSuitInfo
      ? "让" + dominantSuitInfo.focus + "成为突破口"
      : "把问题放回更长的成长主线";
    const theme = domain.theme + " · " + suitTheme;

    const positionLead = {
      past: "这次议题的来路，带着“",
      present: "当下最值得看清的，是“",
      future: "如果延续现在的做法，接下来更靠近“"
    };
    const positionTail = {
      past: "”的痕迹。",
      present: "”正在怎样发生。",
      future: "”的方向；这不是定数，你仍能改写。"
    };

    const insights = cardInfos.map(function (entry, index) {
      const k = entry.knowledge || {};
      const card = entry.item.card;
      const keywords = (k.keywords || String(card.up || "").split("，")).slice(0, 3);
      const keywordText = keywords.join("、");
      const knowledgeMeaning = k.meaning || card.up || "这张牌提醒你观察当前的能量与选择。";
      const knowledgeAdvice = k.advice || "把牌义转成一个今天可以完成的小动作。";
      const lens = domain.lens[entry.positionKey] || "";
      let structure = "";

      if (k.arcana === "major") {
        structure = "这是大阿卡纳，提示你从更长的成长主线，而不只是单次得失来理解它。";
      } else if (k.suitInfo && k.rankInfo) {
        structure = "这张" + k.suitInfo.element + "元素牌处在“" + k.rankInfo.stage + "”阶段，重点是" + k.suitInfo.focus + "。";
      }

      let tag = "大阿卡纳";
      if (k.arcana === "minor" && k.suitInfo && k.rankInfo) {
        tag = k.suitInfo.element + "元素 · " + k.suitInfo.name + " · " + k.rankInfo.stage;
      }

      let relation = "";
      if (index === 0 && cardInfos[1]) {
        relation = "与现在牌的呼应：" + transitionText(entry, cardInfos[1]);
      } else if (index === 1) {
        relation = (cardInfos[0] ? "从过去延续到当下：" + transitionText(cardInfos[0], entry) : "") +
          (cardInfos[2] ? " 从当下走向未来：" + transitionText(entry, cardInfos[2]) : "");
      } else if (index === 2 && cardInfos[1]) {
        relation = "与现在牌的呼应：" + transitionText(cardInfos[1], entry);
      }

      return {
        position: entry.position,
        cardName: card.zh,
        cardEn: card.en,
        keyword: keywordText,
        tag: tag,
        body: positionLead[entry.positionKey] + keywordText + positionTail[entry.positionKey] + knowledgeMeaning + (lens ? " " + lens : "") + (structure ? " " + structure : ""),
        advice: knowledgeAdvice,
        relation: relation,
        prompt: buildCardPrompt(entry, entry.positionKey)
      };
    });

    const structureParts = [];
    if (majorCount === 3) {
      structureParts.push("三张都是大阿卡纳，说明这不是短期技巧问题，而是价值观或人生阶段的转折。");
    } else if (majorCount === 2) {
      structureParts.push("两张牌来自大阿卡纳，议题带有较长的成长线索，近期动作要服务于更根本的方向。");
    } else if (majorCount === 1) {
      structureParts.push("一张大阿卡纳点出了贯穿其中的主线，其余小阿卡纳负责呈现日常层面的细节。");
    } else {
      structureParts.push("三张都是小阿卡纳，说明议题主要落在可调整的日常细节与具体做法上。");
    }

    if (dominantSuitInfo && minorEntries.length > 1) {
      if (suitOrder.length === 1) {
        structureParts.push("三张牌都落在" + dominantSuitInfo.name + "，" + dominantSuitInfo.gift + "是当前最鲜明的资源，也要留意" + dominantSuitInfo.shadow + "。");
      } else {
        structureParts.push("牌面重心偏向" + dominantSuitInfo.name + "，核心在" + dominantSuitInfo.theme + "。");
      }
    }
    if (courtCount >= 2) {
      structureParts.push("两张以上的宫廷牌出现，提醒你观察自己正在扮演的角色，也要看清身边实际影响决定的人。");
    }

    const pathText = insights.map(function (entry) {
      return entry.cardName + "（" + entry.keyword.split("、").slice(0, 2).join("、") + "）";
    }).join(" → ");
    const summary = "针对“" + (question || "你此刻的问题") + "”，分析重心落在" + domain.label + "。" +
      domain.premise + " 牌面以“" + pathText + "”展开。" +
      structureParts.join("") + domain.closing;

    const pastEntry = cardInfos[0];
    const presentEntry = cardInfos[1];
    const futureEntry = cardInfos[2];
    const pastName = pastEntry.item.card.zh;
    const presentName = presentEntry.item.card.zh;
    const futureName = futureEntry.item.card.zh;
    const presentKeywords = cardKeywords(presentEntry, 3) || "当下课题";
    const futureKeywords = cardKeywords(futureEntry, 2) || "下一步";
    const presentMeaning = presentEntry.knowledge && presentEntry.knowledge.meaning || presentEntry.item.card.up || "";
    const futureMeaning = futureEntry.knowledge && futureEntry.knowledge.meaning || futureEntry.item.card.up || "";
    const presentAdvice = presentEntry.knowledge && presentEntry.knowledge.advice ||
      "先把当下最真实的需要说清楚，再决定下一步。";
    const futureSuitInfo = futureEntry.knowledge && futureEntry.knowledge.suitInfo;
    const firstMajorEntry = cardInfos.find(function (entry) {
      return entry.knowledge && entry.knowledge.arcana === "major";
    });
    const answerProfile = selectAnswerProfile(question, domainKey);
    const presentCoreKeyword = presentKeywords.split("、")[0] || "当下的重点";
    const futureCoreKeyword = futureKeywords.split("、")[0] || "下一步";
    const futureCaution = futureSuitInfo
      ? "警惕「" + futureSuitInfo.shadow.split("、")[0] + "」"
      : answerProfile.keyPoints[2];
    const cardTakeaways = cardInfos.map(function (entry, index) {
      const keywords = cardKeywords(entry, 2) || "当下的课题";
      let note = "";
      if (index === 0) {
        note = "在来路上留下「" + keywords + "」的影响；先确认这段经验今天是在帮助你，还是也在限制你。";
      } else if (index === 1) {
        note = "当下重点是把「" + keywords + "」落到一个具体动作上，而不是只停留在感受或猜测里。";
      } else {
        note = "延续现在的做法，会更容易靠近「" + keywords + "」；这是趋势，不是无法改写的定数。";
      }
      return {
        position: entry.position,
        name: entry.item.card.zh,
        orientation: "正位",
        note: note
      };
    });
    const directAnswer = {
      headline: answerProfile.headline,
      verdict: answerProfile.verdict,
      reason: "原因很简单：" + answerProfile.reasonLead +
        " 这组牌从「" + pastName + "（" + (cardKeywords(pastEntry, 2) || "来路") + "）」展开，" +
        "当下落在「" + presentName + "（" + presentKeywords + "）」，最后指向「" +
        futureName + "（" + futureKeywords + "）」。",
      keyPoints: answerProfile.useKeyPointsAsIs
        ? answerProfile.keyPoints.slice(0, 3)
        : unique([
          answerProfile.keyPoints[0],
          answerProfile.keyPoints[1],
          futureCaution
        ]).slice(0, 3),
      cards: cardTakeaways
    };

    const resourceTitle = dominantSuitInfo
      ? "先调用「" + dominantSuitInfo.element + "」元素的力量"
      : "把大阿卡纳的方向感落回日常";
    const resourceBody = dominantSuitInfo
      ? dominantSuitInfo.gift + "。牌阵已经在提示：你不缺所有答案，缺的是把这项资源用在一个具体选择上。"
      : "三张牌把注意力从短期结果拉向更长的成长主线。先确认你愿意长期承担什么，再用小行动验证。";
    const cautionTitle = futureSuitInfo
      ? "别让「" + futureSuitInfo.shadow + "」接管决定"
      : "别把当下的情绪当成最终结论";
    const cautionBody = futureSuitInfo
      ? "未来位置出现" + futureSuitInfo.name + "牌，说明" + futureSuitInfo.theme + "会是接下来最需要被照看的部分。"
      : "当前感受是重要信号，但仍需要和事实、行动及时间放在一起核对。";

    const signals = [
      {
        label: "牌阵焦点",
        title: domain.short + " · " + modeLabels[mode],
        body: domain.premise
      },
      {
        label: "可用资源",
        title: resourceTitle,
        body: resourceBody
      },
      {
        label: "需要留意",
        title: cautionTitle,
        body: cautionBody
      }
    ];

    const deepSections = [
      {
        index: "01",
        title: "这组牌真正想让你看清什么",
        body: "这组牌把问题放在“" + domain.label + "”的语境里，并以“" + presentName + "”作为当下的核心。" +
          "它带来的关键词是“" + presentKeywords + "”。" + presentMeaning +
          " 因此，这不是一个只需要等待外界给答案的问题；它更想让你看见自己的需要、边界，以及下一步愿意承担什么。"
      },
      {
        index: "02",
        title: pastName + " → " + presentName + "：来路怎样变成当下",
        body: transitionText(pastEntry, presentEntry) +
          " 从牌义看，过去的“" + cardKeywords(pastEntry, 2) + "”留下了影响；而现在的“" +
          presentKeywords + "”正在要求你更新原来的应对方式。" + domain.lens.present
      },
      {
        index: "03",
        title: presentName + " → " + futureName + "：下一步会被什么改写",
        body: transitionText(presentEntry, futureEntry) +
          " 未来牌给出的不是固定结果，而是一种延续当前节奏时更可能靠近的方向：" + futureMeaning +
          " 能否改变走向，关键不在于猜测时间点，而在于你现在如何处理“" + presentKeywords.split("、")[0] + "”。" + domain.lens.future
      },
      {
        index: "04",
        title: "把三张牌合起来看",
        body: structureParts.join("") +
          (firstMajorEntry
            ? " " + firstMajorEntry.position + "位置出现的" + firstMajorEntry.item.card.zh + "，是贯穿全阵的长线主题；小阿卡纳则告诉你它在现实里怎样发生。"
            : " 牌面主要由小阿卡纳组成，说明这件事的突破口通常不在宏大决定，而在日常重复的选择、沟通和执行方式。") +
          " " + domain.closing
      }
    ];

    const paths = [
      {
        label: "若维持惯性",
        title: "先看清“" + futureKeywords.split("、")[0] + "”会怎样延续",
        body: "如果继续沿用现在的反应方式，" + futureName + "所代表的“" + futureKeywords +
          "”会更容易成为主线。它提醒你的不是厄运，而是：同一套做法很可能继续产生同一类结果。"
      },
      {
        label: "若主动调整",
        title: "从“" + presentKeywords.split("、")[0] + "”处打开一个缺口",
        body: presentAdvice + " 再配合一个现实动作：" + domain.actions[0] +
          " 不需要一次解决全部问题，只要让新的反馈进入局面。"
      },
      {
        label: "关键观察点",
        title: firstMajorEntry
          ? "观察长线课题是否得到回应"
          : courtCount >= 2
            ? "观察角色与边界是否发生变化"
            : "观察行动是否真的发生",
        body: modeAdvice[mode] +
          " 接下来的判断标准，不是“感觉有没有变好”，而是你能否指出一个已经发生的事实变化。"
      }
    ];

    const reflections = unique([
      (domainQuestions[domainKey] || [])[0],
      (domainQuestions[domainKey] || [])[1],
      modeQuestions[mode],
      (domainQuestions[domainKey] || [])[2]
    ].filter(Boolean)).slice(0, 4);

    let structureAdvice = "";
    if (majorCount >= 2) {
      structureAdvice = "先确认这件事是否正在要求你调整价值观或生活结构，不要只用短期技巧压住问题。";
    } else if ((suitCounts.swords || 0) >= 2) {
      structureAdvice = "在情绪高点不做最终决定；先区分事实、假设与担忧，再沟通或行动。";
    } else if ((suitCounts.cups || 0) >= 2) {
      structureAdvice = "把感受说出来，但不要把感受当作唯一证据；观察行动是否与表达一致。";
    } else if ((suitCounts.wands || 0) >= 2) {
      structureAdvice = "能量已经出现，阻力多在节奏；给行动设一个最小可执行版本。";
    } else if ((suitCounts.pentacles || 0) >= 2) {
      structureAdvice = "回到预算、时间表和身体状态；具体数字往往比想象更能安定你。";
    } else if (courtCount >= 2) {
      structureAdvice = "分清自己的判断与身边人的期待，重要决定需要由你亲自承担。";
    } else {
      structureAdvice = "从三张牌里选出一句最触动你的关键词，把它改写成一个本周可以观察的行为。";
    }

    const presentKnowledge = cardInfos[1] && cardInfos[1].knowledge;
    const advice = unique([
      domain.actions[0],
      domain.actions[1],
      presentKnowledge && presentKnowledge.advice,
      modeAdvice[mode],
      structureAdvice,
      domain.actions[2]
    ].filter(Boolean)).slice(0, 5);

    return {
      domainKey: domainKey,
      domainLabel: domain.label,
      domainShort: domain.short,
      mode: mode,
      modeLabel: modeLabels[mode],
      matchedKeywords: domainResult.matched,
      theme: theme,
      headline: directAnswer.headline,
      directAnswer: directAnswer,
      summary: summary,
      structure: structureParts.join(" "),
      stats: [
        { label: "大阿卡纳", value: majorCount + " / 3" },
        { label: "元素分布", value: elementParts.length ? elementParts.join(" · ") : "无" },
        { label: "问题形态", value: modeLabels[mode] }
      ],
      signals: signals,
      deepSections: deepSections,
      paths: paths,
      reflections: reflections,
      insights: insights,
      advice: advice,
      nowAction: domain.nowAction,
      disclaimer: "塔罗用于自我觉察与整理思路，不构成医疗、法律、投资或其他专业建议。未来会因你的选择而改变。"
    };
  }

  global.TAROT_KB = {
    meta: {
      name: "Rider–Waite–Smith 78 张塔罗知识库",
      version: "1.0",
      cardCount: 78,
      note: "以项目内 78 张牌义为基础，补充花色、数字阶段、问题语境与行动建议。"
    },
    domains: domains,
    positions: positions,
    suits: suits,
    ranks: ranks,
    majors: major,
    minors: minorData,
    getCard: getCard,
    analyze: analyze
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.TAROT_KB;
  }
})(typeof window !== "undefined" ? window : globalThis);
