const MAJOR = {
  "major-00": "愚者", "major-01": "魔术师", "major-02": "女祭司", "major-03": "女皇",
  "major-04": "皇帝", "major-05": "教皇", "major-06": "恋人", "major-07": "战车",
  "major-08": "力量", "major-09": "隐士", "major-10": "命运之轮", "major-11": "正义",
  "major-12": "倒吊人", "major-13": "死神", "major-14": "节制", "major-15": "恶魔",
  "major-16": "高塔", "major-17": "星星", "major-18": "月亮", "major-19": "太阳",
  "major-20": "审判", "major-21": "世界"
};

const SUITS = {
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币"
};

const RANKS = {
  "01": "王牌", "02": "二", "03": "三", "04": "四", "05": "五",
  "06": "六", "07": "七", "08": "八", "09": "九", "10": "十",
  "11": "侍从", "12": "骑士", "13": "王后", "14": "国王"
};

const ORBIT_COUNT = 4;
const TAU = Math.PI * 2;

function cardName(cardOrFile) {
  const file = typeof cardOrFile === "string"
    ? cardOrFile
    : String(cardOrFile?.file || cardOrFile?.code || "");
  const named = typeof cardOrFile === "object"
    ? String(cardOrFile?.zh || cardOrFile?.name || "")
    : "";
  if (named) return named;
  if (MAJOR[file]) return MAJOR[file];
  const [suit, rank] = file.split("-");
  return `${SUITS[suit] || ""}${RANKS[rank] || ""}` || file;
}

function formatTimestamp(value) {
  const date = new Date(Number(value) || value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("/") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function asText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function compact(value) {
  return asText(value).replace(/\s+/g, " ").trim();
}

function buildSummary(record) {
  const analysis = record.analysis || {};
  const direct = analysis.directAnswer || {};
  const pieces = [
    asText(direct.verdict),
    asText(direct.reason),
    asText(analysis.summary)
  ].filter(Boolean);
  return compact(pieces.join(" ")).slice(0, 420) || "这份记录已保存在你的星轨中，打开完整解析回看当时的牌面。";
}

function buildFullReading(record) {
  const analysis = record.analysis || {};
  const direct = analysis.directAnswer || {};
  const lines = [];

  lines.push("◆ " + (asText(analysis.headline) || asText(analysis.theme) || "牌阵综合解析") + " ◆");
  lines.push("");
  lines.push(`你的问题：“${asText(record.question) || "未命名问题"}”`);
  if (record.spreadName) lines.push(`牌阵：${record.spreadName} · ${record.cards.length} 张牌`);
  lines.push(`解读来源：${record.source === "ai" ? "AI 深读 × 知识库" : "本地知识库"}`);
  lines.push("");

  if (direct.verdict) {
    lines.push("【直接回答】");
    lines.push(direct.verdict);
    if (direct.reason) {
      lines.push("");
      lines.push("【为什么】");
      lines.push(direct.reason);
    }
    if (Array.isArray(direct.keyPoints) && direct.keyPoints.length) {
      lines.push("");
      lines.push("【关键启示】");
      direct.keyPoints.forEach((point) => lines.push("· " + point));
    }
    lines.push("");
  } else if (analysis.summary) {
    lines.push("【牌阵总览】");
    lines.push(analysis.summary);
    lines.push("");
  }

  if (record.cards.length) {
    lines.push("【牌面总览】");
    record.cards.forEach((card, index) => {
      lines.push(
        String(index + 1).padStart(2, "0") + ". " +
        (card.position || `位置 ${index + 1}`) +
        " · " + cardName(card) +
        "（" + (card.orientation || "正位") + "）"
      );
      const positionMeaning = card.positionMeaning || card.posMeaning;
      if (positionMeaning) lines.push("    " + positionMeaning);
    });
    lines.push("");
  }

  if (Array.isArray(analysis.stats) && analysis.stats.length) {
    lines.push("【牌阵结构】");
    analysis.stats.forEach((item) => {
      if (item?.label || item?.value) lines.push(`· ${asText(item.label)}：${asText(item.value)}`);
    });
    lines.push("");
  }

  if (Array.isArray(analysis.signals) && analysis.signals.length) {
    lines.push("【牌与牌的关系】");
    analysis.signals.forEach((signal) => {
      if (signal?.title) lines.push(`— ${signal.title} —`);
      if (signal?.body) lines.push(signal.body);
      lines.push("");
    });
  }

  if (Array.isArray(analysis.deepSections) && analysis.deepSections.length) {
    lines.push("【牌阵深读】");
    analysis.deepSections.forEach((section) => {
      lines.push(`${asText(section.index)} ${asText(section.title)}`.trim());
      if (section.body) lines.push(section.body);
      lines.push("");
    });
  }

  if (Array.isArray(analysis.insights) && analysis.insights.length) {
    lines.push("【按牌阵位置逐张解读】");
    analysis.insights.forEach((insight) => {
      const heading = [
        asText(insight.position),
        asText(insight.cardName),
        insight.orientation ? `（${asText(insight.orientation)}）` : ""
      ].filter(Boolean).join(" · ");
      lines.push("— " + heading + " —");
      if (insight.keyword) lines.push("关键词：" + insight.keyword);
      if (insight.body) lines.push(insight.body);
      if (insight.relation) lines.push("牌阵关系：" + insight.relation);
      if (insight.advice) lines.push("行动提示：" + insight.advice);
      if (insight.prompt) lines.push("复盘提问：" + insight.prompt);
      lines.push("");
    });
  }

  if (Array.isArray(analysis.paths) && analysis.paths.length) {
    lines.push("【三种可能的走向】");
    analysis.paths.forEach((path) => {
      lines.push(`${asText(path.label) || "可能走向"} · ${asText(path.title)}`.trim());
      if (path.body) lines.push(path.body);
      lines.push("");
    });
  }

  if (Array.isArray(analysis.reflections) && analysis.reflections.length) {
    lines.push("【带着这些问题再看一遍】");
    analysis.reflections.forEach((item, index) => {
      lines.push(String(index + 1).padStart(2, "0") + ". " + item);
    });
    lines.push("");
  }

  if (analysis.disclaimer) {
    lines.push("————————————————");
    lines.push(analysis.disclaimer);
  }

  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function toViewRecord(record, index) {
  const cards = Array.isArray(record.cards) ? record.cards.map((card, cardIndex) => ({
    code: String(card.file || ""),
    file: String(card.file || ""),
    name: cardName(card),
    zh: String(card.zh || cardName(card)),
    en: String(card.en || ""),
    position: String(card.pos || `位置 ${cardIndex + 1}`),
    posMeaning: String(card.posMeaning || ""),
    orientation: String(card.orientation || "正位")
  })).filter((card) => card.file) : [];

  return {
    id: String(record.id),
    createdAt: Number(record.createdAt || 0),
    date: formatTimestamp(record.createdAt),
    question: String(record.question || "未命名问题"),
    spreadId: String(record.spreadId || ""),
    spreadName: String(record.spreadName || "塔罗牌阵"),
    source: record.source === "ai" ? "ai" : "local",
    cards,
    summary: buildSummary(record),
    full: buildFullReading({ ...record, cards }),
    orbit: index % ORBIT_COUNT,
    angle: (Math.floor(index / ORBIT_COUNT) * (TAU / 3) + (index % ORBIT_COUNT) * 0.36 + 0.32) % TAU,
    showOrbit: index < 12
  };
}

export function loadHistoryRecords() {
  try {
    const stored = window.TarotHistory?.list?.() || [];
    return stored.map(toViewRecord);
  } catch (error) {
    console.warn("星轨历史数据转换失败：", error);
    return [];
  }
}

export { cardName };
