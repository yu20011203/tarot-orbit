(function () {
  "use strict";

  const API_URL = "https://text.pollinations.ai/openai";
  const MODEL = "openai-fast";
  const KB_URL = "tarot-kb-static.json";
  let knowledgePromise = null;

  const SYSTEM_PROMPT = `你是一名资深塔罗师，也是提问式解读顾问。你的目标不是百科式复述牌意，而是围绕提问者的问题，说明这组牌在这个牌阵中反映出的现实处境、心理结构、核心矛盾与可选行动。

硬性规则：
1. 只使用本次提供的牌，不得新增牌；全部按正位解读。
2. 每张牌必须结合牌阵位置、牌面符号、元素或数字，并说明它与前后位置的联动。
3. 不同牌阵按各自结构解读，不能一律套用“过去、现在、未来”。
4. 直接回答问题，避免任何牌都能套用的空话。
5. 趋势只写条件和可能性，不使用“必然、一定会、注定、绝对、肯定会出现”等表达。
6. 感情议题不得猜测对方真实想法、动机或是否爱提问者；只能写象征层面的可观察线索，并强调真实沟通。
7. 财务议题不得预测涨跌，不得给具体买卖、借贷或投资指令。
8. 身心议题不得作医学或心理诊断，只能描述压力、能量、作息与行为模式，并提醒持续不适时求助专业人士。
9. 不照抄知识库原文，不单列“给你的建议”模块；把行动建议自然融入牌阵深读、单牌提示与可能走向。
10. 只输出一个合法 JSON 对象，不要代码围栏，不要 JSON 前后的解释；必须完整闭合，不得在字符串、数组或对象中途结束。
11. 5 张及以上牌阵优先保证每张牌都有独立判断，按给定字段写得紧凑，不得省略 cardNotes 或 insights 中的任何一项。`;

  function clip(value, max) {
    const text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  function loadKnowledge() {
    if (!knowledgePromise) {
      knowledgePromise = fetch(KB_URL, { cache: "force-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("知识库读取失败（HTTP " + response.status + "）");
          return response.json();
        })
        .then(function (data) {
          if (!data || !data.cards) throw new Error("知识库格式异常");
          return data.cards;
        })
        .catch(function (error) {
          knowledgePromise = null;
          throw error;
        });
    }
    return knowledgePromise;
  }

  function questionScenes(question) {
    const text = String(question || "");
    const scenes = [];
    if (/感情|恋爱|喜欢|伴侣|男友|女友|对象|分手|复合|婚姻|暧昧|关系|对方|他|她/.test(text)) {
      scenes.push("感情");
    }
    if (/工作|事业|职场|老板|同事|跳槽|求职|面试|项目|创业|晋升|离职/.test(text)) {
      scenes.push("工作");
    }
    if (/钱|财务|收入|投资|理财|买房|贷款|预算|债务|工资/.test(text)) {
      scenes.push("财务");
    }
    if (/健康|身体|睡眠|焦虑|压力|疲惫|情绪|心理|作息/.test(text)) {
      scenes.push("身心");
    }
    return scenes;
  }

  function cardContext(card, position, knowledge, scenes) {
    const info = knowledge[card.file] || {};
    const chosenScenes = scenes.length ? scenes : ["感情", "工作", "财务", "身心"];
    const scenarioText = chosenScenes
      .map(function (scene) {
        const value = info.scenarios && info.scenarios[scene];
        return value ? "- " + scene + "：" + clip(value, 260) : "";
      })
      .filter(Boolean)
      .join("\n");
    const symbols = (info.symbols || []).slice(0, 4).map(function (item) {
      return "- " + clip(item, 260);
    }).join("\n");
    const identity = [
      info.arcana || (card.arcana === "major" ? "大阿卡纳" : "小阿卡纳"),
      info.element ? info.element + "元素" : "",
      info.number != null ? "数字/序号 " + info.number : (info.rank || "")
    ].filter(Boolean).join("，");

    return [
      "【" + position.name + "｜" + (info.name || card.zh) + "（" + (info.en || card.en) + "）】",
      "位置含义：" + (position.meaning || "未提供"),
      "牌面身份：" + identity,
      "一句话理解：" + clip(info.one_sentence || card.up || "未提取", 300),
      "关键词：" + ((info.keywords || []).slice(0, 6).join("、") || "未提取"),
      "牌面符号：",
      symbols || "- 未提取",
      "正位解读：" + clip(info.upright || card.up || "未提取", 900),
      "问题场景提示：",
      scenarioText || "- 未提取",
      "常见误区：" + ((info.misconceptions || []).slice(0, 2).map(function (item) {
        return clip(item, 220);
      }).join("；") || "未提取"),
      "提示：以上只是知识摘录，必须转成对本次问题、这个牌阵位置的具体判断，不要照抄。"
    ].join("\n");
  }

  function outputSchema(count) {
    const compact = count > 3;
    const lite = count >= 7;
    if (lite) {
      const liteNotes = Array.from({ length: count }, function (_, index) {
        return JSON.stringify("第 " + (index + 1) + " 位：这张牌在此位置对问题的具体判断，50-80字");
      }).join(", ");
      return `{
  "headline": "不超过20字的核心标题",
  "verdict": "120-180字，直接回答问题并给出整体方向",
  "reason": "70-110字，说明结论从哪些关键位置推出",
  "keyPoints": ["关键启示1（不超过16字）", "关键启示2（不超过16字）", "关键启示3（不超过16字）"],
  "cardNotes": [${liteNotes}],
  "summary": "160-220字，说明所有牌如何合成整体答案",
  "deepSections": [
    {"title":"核心结构与难点","body":"150-220字，按本牌阵结构解释关键牌之间的联动"},
    {"title":"接下来可以怎么做","body":"120-180字，给出3-4条低成本、可执行的行动"}
  ],
  "reflections": ["复盘问题1（不超过40字）", "复盘问题2（不超过40字）"],
  "disclaimer": "塔罗用于自我觉察，不构成医疗、法律、投资或其他专业建议。"
}`;
    }
    const notes = Array.from({ length: count }, function (_, index) {
      return JSON.stringify(
        "第 " + (index + 1) + " 位：" +
        (compact
          ? "这张牌在此位置对问题的具体判断，70-110字"
          : "这张牌在此位置对问题的具体判断，130-220字")
      );
    }).join(", ");
    const insights = Array.from({ length: count }, function () {
      if (compact) {
        return '{"body":"这张牌在此位置针对问题的判断，60-110字"}';
      }
      return '{"body":"这张牌在此位置针对问题的具体解读，120-200字","advice":"一条具体可执行行动，40-80字","relation":"与前后位置的联动，30-80字","prompt":"一个自我核对问题，20-40字"}';
    }).join(", ");
    const deepTitles = compact
      ? ["问题真正的难点", "牌与牌怎样互相影响", "接下来可以怎么做"]
      : ["问题真正的难点", "位置之间怎样互相影响", "哪些条件会改变走向", "接下来可以怎么做"];
    const deepSections = deepTitles.map(function (title) {
      return '{"title":"' + title + '","body":"' +
        (compact ? "120-200字" : "160-260字") +
        '，必须围绕本题和本牌阵展开"}';
    }).join(", ");
    return `{
  "headline": "不超过24字的核心标题",
  "verdict": "${compact ? "140-220" : "180-280"}字，直接回答问题，并点明牌阵给出的核心方向",
  "reason": "${compact ? "80-130" : "100-160"}字，说明结论从哪些牌与位置推出",
  "keyPoints": ["关键启示1（不超过18字）", "关键启示2（不超过18字）", "关键启示3（不超过18字）"],
  "cardNotes": [${notes}],
  "summary": "${compact ? "160-240" : "200-320"}字，说明所有牌如何合起来回答这个问题",
  "signals": [
    {"label":"真实处境","title":"短标题","body":"${compact ? "60-100" : "90-150"}字"},
    {"label":"核心资源","title":"短标题","body":"${compact ? "60-100" : "90-150"}字"},
    {"label":"关键阻力","title":"短标题","body":"${compact ? "60-100" : "90-150"}字"}
  ],
  "deepSections": [${deepSections}],
  "insights": [${insights}],
  "paths": [
    {"label":"若维持惯性","title":"短标题","body":"${compact ? "70-110" : "100-160"}字"},
    {"label":"若主动调整","title":"短标题","body":"${compact ? "70-110" : "100-160"}字"},
    {"label":"关键观察点","title":"短标题","body":"${compact ? "70-110" : "100-160"}字"}
  ],
  "reflections": [${compact ? '"复盘问题1（不超过40字）", "复盘问题2（不超过40字）"' : '"复盘问题1", "复盘问题2", "复盘问题3"'}],
  "disclaimer": "塔罗用于自我觉察，不构成医疗、法律、投资或其他专业建议。"
}`;
  }

  function buildPrompt(context, knowledge) {
    const scenes = questionScenes(context.question);
    const positions = context.spread.positions || [];
    const cardBlocks = context.drawn.map(function (item, index) {
      const position = positions[index] || { name: item.pos || "位置 " + (index + 1), meaning: item.posMeaning || "" };
      return cardContext(item.card, position, knowledge, scenes);
    }).join("\n\n");
    const positionLine = positions.map(function (position) { return position.name; }).join(" → ");
    const useCases = (context.spread.useCases || []).join("、") || "未提供";
    const tips = (context.spread.tips || []).map(function (tip) { return "- " + tip; }).join("\n") || "- 无额外提示";

    return `提问者的问题：
${context.question}

牌阵：
${context.spread.name}（${context.drawn.length} 张牌，全部正位）
位置顺序：${positionLine}
牌阵用途：${context.spread.summary || ""}
适合的问题：${useCases}
牌阵提示：
${tips}

知识库摘录：
${cardBlocks}

请严格围绕这个问题和本牌阵结构完成解读。按以下 JSON 结构输出，字段不可缺；cardNotes 与 insights 必须各含 ${context.drawn.length} 项，并与牌的位置顺序一一对应：
${outputSchema(context.drawn.length)}`;
  }

  function extractJson(content) {
    let text = String(content || "").trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return JSON.parse(text);
    } catch (firstError) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("AI 未返回可解析的 JSON");
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (secondError) {
        throw new Error("AI 返回的 JSON 格式不完整");
      }
    }
  }

  function clean(value, max) {
    return clip(value, max || 2000);
  }

  function stringList(value, limit, maxLength) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, limit).map(function (item) {
      return clean(item, maxLength || 500);
    }).filter(Boolean);
  }

  function objectList(value, limit) {
    return Array.isArray(value)
      ? value.filter(function (item) { return item && typeof item === "object"; }).slice(0, limit)
      : [];
  }

  function shapeReading(parsed, context) {
    if (!parsed || typeof parsed !== "object") throw new Error("AI 返回内容格式异常");
    const headline = clean(parsed.headline, 80);
    const verdict = clean(parsed.verdict, 1200);
    if (!headline || !verdict) throw new Error("AI 返回内容缺少核心结论");

    const positions = context.spread.positions || [];
    const count = context.drawn.length;
    const notes = stringList(parsed.cardNotes, count, 700);
    while (notes.length < count) notes.push("这张牌的位置线索仍需结合问题进一步核对。");

    const signals = objectList(parsed.signals, 3).map(function (item, index) {
      return {
        label: clean(item.label, 24) || "线索 " + (index + 1),
        title: clean(item.title, 80) || "牌阵线索",
        body: clean(item.body, 900)
      };
    });
    const deepSections = objectList(parsed.deepSections, 5).map(function (item, index) {
      return {
        index: String(index + 1).padStart(2, "0"),
        title: clean(item.title, 100),
        body: clean(item.body, 1800)
      };
    }).filter(function (item) { return item.title && item.body; });
    const rawInsights = objectList(parsed.insights, count);
    const insights = context.drawn.map(function (item, index) {
      const source = rawInsights[index] || {};
      const position = positions[index] || { name: item.pos || "位置 " + (index + 1), meaning: item.posMeaning || "" };
      const info = item.knowledge || {};
      const insight = {
        position: position.name,
        positionMeaning: position.meaning || "",
        cardName: info.name || item.card.zh,
        cardEn: info.en || item.card.en,
        keyword: (info.keywords || []).slice(0, 3).join("、") || item.card.up || "观察当下",
        tag: info.tag || (item.card.arcana === "major" ? "大阿卡纳" : "小阿卡纳"),
        body: clean(source.body, 1800) || notes[index]
      };
      if (source.advice) insight.advice = clean(source.advice, 600);
      if (source.relation) insight.relation = clean(source.relation, 600);
      if (source.prompt) insight.prompt = clean(source.prompt, 500);
      return insight;
    });
    const paths = objectList(parsed.paths, 3).map(function (item, index) {
      return {
        label: clean(item.label, 30) || "可能走向 " + (index + 1),
        title: clean(item.title, 100) || "观察变化",
        body: clean(item.body, 1200)
      };
    });

    return {
      source: "ai-free",
      aiLabel: "免费 AI × 78 张牌知识库",
      theme: headline,
      headline: headline,
      modeLabel: "AI 深度解读",
      directAnswer: {
        verdict: verdict,
        reason: clean(parsed.reason, 900),
        keyPoints: stringList(parsed.keyPoints, 4, 140),
        cards: context.drawn.map(function (item, index) {
          const position = positions[index] || { name: item.pos || "位置 " + (index + 1) };
          const info = item.knowledge || {};
          return {
            position: position.name,
            name: info.name || item.card.zh,
            orientation: "正位",
            note: notes[index]
          };
        })
      },
      summary: clean(parsed.summary, 1800) || verdict,
      signals: signals,
      deepSections: deepSections,
      insights: insights,
      paths: paths,
      reflections: stringList(parsed.reflections, 4, 300),
      disclaimer: clean(parsed.disclaimer, 300) || "塔罗用于自我觉察，不构成医疗、法律、投资或其他专业建议。"
    };
  }

  async function read(context, signal) {
    const knowledge = await loadKnowledge();
    const enriched = Object.assign({}, context, {
      drawn: context.drawn.map(function (item) {
        return Object.assign({}, item, { knowledge: knowledge[item.card.file] || {} });
      })
    });
    const prompt = buildPrompt(enriched, knowledge);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      cache: "no-store",
      signal: signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.35,
        max_tokens: 9000,
        reasoning_effort: "low",
        private: true
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(function () { return ""; });
      if (detail.indexOf("FREE_LIMIT") >= 0 || response.status === 429 || response.status === 402) {
        throw new Error("免费 AI 当前排队繁忙，请约 45 秒后再试；本次已保留本地知识库解读");
      }
      throw new Error("免费 AI 请求失败（HTTP " + response.status + "）" + (detail ? "：" + clip(detail, 160) : ""));
    }
    const data = await response.json().catch(function () {
      throw new Error("免费 AI 返回格式异常");
    });
    let content = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";
    if (Array.isArray(content)) {
      content = content.map(function (part) {
        return part && typeof part === "object" ? (part.text || "") : String(part || "");
      }).join("");
    }
    if (!content || !String(content).trim()) throw new Error("免费 AI 未返回有效内容");
    return shapeReading(extractJson(content), enriched);
  }

  window.TarotFreeAI = {
    read: read,
    buildPrompt: function (context) {
      return loadKnowledge().then(function (knowledge) {
        return buildPrompt(context, knowledge);
      });
    }
  };
})();
