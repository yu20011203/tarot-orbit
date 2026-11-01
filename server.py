#!/usr/bin/env python3
"""Tarot reading server with an OpenAI-compatible API proxy.

The browser never receives the API key. The server resolves each drawn card to
its Markdown page in the tarot knowledge base, extracts only the upright
material, and asks the configured model to interpret the user's question.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


APP_DIR = Path(__file__).resolve().parent
ALLOWED_DECKS = {"full", "major", "minor", "wands", "cups", "swords", "pentacles"}
SPREADS_FILE = Path("content") / "spreads.json"


def _load_dotenv(path: Path) -> None:
    """Load a small, predictable subset of dotenv syntax without dependencies."""
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name, "").strip().lower()
    if not value:
        return default
    return value not in {"0", "false", "no", "off", "否"}


@dataclass(frozen=True)
class Settings:
    api_base: str
    api_key: str
    model: str
    api_timeout: float
    max_tokens: int
    json_mode: bool
    kb_root: Path
    host: str
    port: int

    @property
    def ai_configured(self) -> bool:
        return bool(self.api_key and self.api_base and self.model)

    @property
    def chat_endpoint(self) -> str:
        base = self.api_base.rstrip("/")
        if base.endswith("/chat/completions"):
            return base
        return base + "/chat/completions"


def load_settings() -> Settings:
    _load_dotenv(APP_DIR / ".env")

    kb_value = os.getenv("TAROT_KB_ROOT", "").strip()
    if kb_value:
        kb_root = Path(os.path.expandvars(os.path.expanduser(kb_value)))
        if not kb_root.is_absolute():
            kb_root = (APP_DIR / kb_root).resolve()
    else:
        candidates = [
            APP_DIR.parent / "tarot-knowledge-base",
            Path(r"D:\codex\tarot-knowledge-base"),
        ]
        kb_root = next((p.resolve() for p in candidates if p.exists()), candidates[-1].resolve())

    def as_float(name: str, default: float) -> float:
        try:
            return max(5.0, float(os.getenv(name, str(default))))
        except ValueError:
            return default

    def as_int(name: str, default: int) -> int:
        try:
            return max(1, int(os.getenv(name, str(default))))
        except ValueError:
            return default

    return Settings(
        api_base=os.getenv("TAROT_API_BASE", "https://api.deepseek.com").strip(),
        api_key=os.getenv("TAROT_API_KEY", "").strip(),
        model=os.getenv("TAROT_MODEL", "deepseek-chat").strip(),
        api_timeout=as_float("TAROT_API_TIMEOUT", 75.0),
        max_tokens=as_int("TAROT_MAX_TOKENS", 6500),
        json_mode=_env_bool("TAROT_JSON_MODE", True),
        kb_root=kb_root,
        host=os.getenv("TAROT_HOST", "127.0.0.1").strip() or "127.0.0.1",
        port=as_int("PORT", 8000),
    )


class KnowledgeBaseError(RuntimeError):
    pass


class ApiError(RuntimeError):
    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.status = status


def _without_markdown(text: str) -> str:
    text = re.sub(r"!\[([^\]]*)]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"(?m)^>\s?", "", text)
    text = re.sub(r"【待核对】[^：\n]*?：", "", text)
    text = re.sub(r"【待核对】[^。\n]*。", "", text)
    text = text.replace("【待核对】", "")
    return re.sub(r"[ \t]+", " ", text).strip()


def _clip(text: str, limit: int) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip("，。；;、 ") + "…"


def _section(markdown: str, title: str) -> str:
    heading = re.compile(r"(?m)^##\s+" + re.escape(title) + r"\s*$")
    match = heading.search(markdown)
    if not match:
        return ""
    next_heading = re.search(r"(?m)^##\s+", markdown[match.end() :])
    end = match.end() + next_heading.start() if next_heading else len(markdown)
    return markdown[match.end() : end].strip()


def _plain_section(markdown: str, title: str) -> str:
    return _without_markdown(_section(markdown, title))


def _bullets(section_text: str) -> list[str]:
    items: list[str] = []
    for line in section_text.splitlines():
        match = re.match(r"^\s*[-*+]\s+(.+)$", line)
        if match:
            clean = _without_markdown(match.group(1))
            if clean:
                items.append(clean)
    return items


def _scenario_hints(section_text: str) -> dict[str, str]:
    table_lines = [line.strip() for line in section_text.splitlines() if line.strip().startswith("|")]
    if len(table_lines) < 3:
        return {}
    rows: list[list[str]] = []
    for line in table_lines:
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if cells and all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            continue
        rows.append(cells)
    if not rows:
        return {}
    header = rows[0]
    scene_index = next((i for i, cell in enumerate(header) if "场景" in cell), 0)
    upright_index = next(
        (i for i, cell in enumerate(header) if "正位" in cell),
        1 if len(header) > 1 else 0,
    )
    result: dict[str, str] = {}
    for row in rows[1:]:
        if max(scene_index, upright_index) >= len(row):
            continue
        scene = _without_markdown(row[scene_index]).strip()
        hint = _without_markdown(row[upright_index]).strip()
        if scene in {"感情", "工作", "财务", "身心"} and hint:
            result[scene] = hint
    return result


class KnowledgeBase:
    SUIT_ALIASES = {
        "wands": "权杖",
        "cups": "圣杯",
        "swords": "宝剑",
        "pentacles": "星币",
    }
    COURT_ALIASES = {
        11: "page",
        12: "knight",
        13: "queen",
        14: "king",
    }
    RANK_STAGE = {
        1: "萌芽",
        2: "平衡与对照",
        3: "发展与协作",
        4: "稳定与结构",
        5: "变动与挑战",
        6: "调和与过渡",
        7: "评估与策略",
        8: "精进与推进",
        9: "接近完成",
        10: "完成与结果",
        11: "学习与试探",
        12: "追击与推进",
        13: "内在掌握",
        14: "外在领导",
    }

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self._cache: dict[tuple[str, int, int], dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._cards: dict[str, dict[str, Any]] = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        cards_path = self.root / "site-data" / "cards.json"
        if not cards_path.is_file():
            raise KnowledgeBaseError(f"找不到牌库清单：{cards_path}")
        try:
            payload = json.loads(cards_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as exc:
            raise KnowledgeBaseError(f"无法读取牌库清单：{exc}") from exc

        raw_items = payload.get("items")
        if not isinstance(raw_items, list):
            raise KnowledgeBaseError("牌库清单缺少 items 数组")
        by_id = {str(item.get("id", "")): item for item in raw_items if item.get("id")}
        if len(by_id) != 78:
            raise KnowledgeBaseError(f"牌库清单应为 78 张牌，实际为 {len(by_id)} 张")

        cards: dict[str, dict[str, Any]] = {}
        for card_id, item in by_id.items():
            rel_path = str(item.get("path", "")).strip()
            if not rel_path:
                raise KnowledgeBaseError(f"牌 {card_id} 缺少 Markdown 路径")
            md_path = (self.root / rel_path).resolve()
            try:
                md_path.relative_to(self.root)
            except ValueError as exc:
                raise KnowledgeBaseError(f"牌 {card_id} 的路径越出知识库目录") from exc
            if not md_path.is_file():
                raise KnowledgeBaseError(f"牌 {card_id} 的 Markdown 不存在：{rel_path}")
            cards[card_id] = dict(item, web_id=card_id, markdown_path=str(md_path))

        for suit_en, suit_cn in self.SUIT_ALIASES.items():
            for number in range(1, 11):
                aligned_id = f"{suit_cn}-{number:02d}"
                web_id = f"{suit_en}-{number:02d}"
                if aligned_id in cards:
                    cards[web_id] = dict(cards[aligned_id], web_id=web_id)
            for number, court_en in self.COURT_ALIASES.items():
                aligned_id = f"{suit_cn}-{court_en}"
                web_id = f"{suit_en}-{number:02d}"
                if aligned_id in cards:
                    cards[web_id] = dict(cards[aligned_id], web_id=web_id)

        for number in range(22):
            web_id = f"major-{number:02d}"
            if web_id not in cards:
                raise KnowledgeBaseError(f"缺少大阿卡纳映射：{web_id}")

        for web_id in list(cards):
            if not re.fullmatch(r"(major|wands|cups|swords|pentacles)-\d{2}", web_id):
                cards.pop(web_id, None)
        if len(cards) != 78:
            raise KnowledgeBaseError(f"网站牌 ID 映射应为 78 张，实际为 {len(cards)} 张")
        self._cards = cards

    @property
    def count(self) -> int:
        return len(self._cards)

    def get(self, web_id: str) -> dict[str, Any]:
        card = self._cards.get(web_id)
        if not card:
            raise KnowledgeBaseError(f"未知牌 ID：{web_id}")
        return card

    def tag(self, card: dict[str, Any]) -> str:
        if card.get("arcana") == "大牌":
            return "大阿卡纳"
        element = card.get("element") or ""
        suit = card.get("suit") or ""
        number = card.get("number")
        rank = card.get("rank")
        if isinstance(number, int):
            stage = self.RANK_STAGE.get(number, "阶段")
            return f"{element}元素 · {suit} · {stage}"
        return f"{element}元素 · {suit} · {rank or '宫廷牌'}"

    def read_card(self, web_id: str) -> dict[str, Any]:
        card = self.get(web_id)
        md_path = Path(card["markdown_path"])
        try:
            stat = md_path.stat()
        except OSError as exc:
            raise KnowledgeBaseError(f"无法读取牌页：{md_path.name}") from exc
        cache_key = (str(md_path), stat.st_mtime_ns, stat.st_size)
        with self._lock:
            cached = self._cache.get(cache_key)
            if cached:
                return cached

        try:
            markdown = md_path.read_text(encoding="utf-8-sig")
        except OSError as exc:
            raise KnowledgeBaseError(f"无法读取牌页：{md_path.name}") from exc

        upright_raw = _section(markdown, "正位怎么读")
        upright = _without_markdown(upright_raw)
        keyword_match = re.search(r"\*\*关键词\*\*\s*[:：]\s*(.+)", upright_raw)
        keywords: list[str] = []
        if keyword_match:
            keywords = [
                item.strip()
                for item in re.split(r"[、,，/]", _without_markdown(keyword_match.group(1)))
                if item.strip()
            ]
        if not keywords:
            keywords = []

        parsed = {
            "web_id": web_id,
            "kb_id": card.get("id") or web_id,
            "name": card.get("name") or md_path.stem,
            "en": card.get("en") or "",
            "arcana": card.get("arcana") or "",
            "suit": card.get("suit"),
            "element": card.get("element") or "",
            "number": card.get("number"),
            "rank": card.get("rank"),
            "tag": self.tag(card),
            "markdown_path": str(md_path),
            "one_sentence": _clip(_plain_section(markdown, "一句话理解"), 500),
            "symbols": _bullets(_section(markdown, "牌面符号"))[:8],
            "upright": _clip(upright, 1800),
            "scenarios": _scenario_hints(_section(markdown, "感情、工作、财务与身心")),
            "misconceptions": _bullets(_section(markdown, "常见误区"))[:5],
            "keywords": keywords[:8],
        }
        with self._lock:
            self._cache[cache_key] = parsed
        return parsed

    def validate_all(self) -> dict[str, int]:
        if not self.root.is_dir():
            raise KnowledgeBaseError(f"知识库目录不存在：{self.root}")
        for web_id in self._cards:
            self.read_card(web_id)
        return {"cards": len(self._cards), "markdownParsed": len(self._cache)}


SYSTEM_PROMPT = """你是一名资深塔罗师，也是严谨的提问式解读顾问。

你的任务不是百科式复述牌意，而是结合提问者的具体问题，解释这组牌在指定牌阵中反映出的处境、心理结构、现实矛盾与可选行动。所有判断都必须能回到本次提供的牌面符号、牌阵位置和知识库摘录。

硬性规则：
1. 只使用本次提供的牌，不得新增牌；不得引入逆位，当前所有牌均按正位解读。
2. 每张牌必须结合它在牌阵中的位置名称、位置含义、牌面符号、元素/数字或宫廷角色，以及与前后位置的联动。
3. 不同牌阵具有不同结构：时间线、比较、关系、事业、推运或无固定位置牌阵必须按各自框架解读，不能生硬套用“过去、现在、未来”。
4. 直接回答提问者的核心问题；避免只写通用牌义，也避免把任何牌都适用的空话。
5. 必须区分事实、感受、猜测与选择。趋势只写条件和可能性，不作绝对预测。
6. 禁止使用“必然、一定会、注定、绝对、肯定会出现”等确定论表达，不制造恐惧。
7. 感情议题不得猜测对方真实想法、动机或是否爱提问者；涉及“对方”的位置只能作为象征层面的可观察线索，并强调真实沟通。
8. 财务议题不得预测涨跌，不得给出具体买卖、借贷或投资指令；只能帮助梳理现金流、风险承受度和决策流程。
9. 身心议题不得作医学或心理诊断；只能描述压力、能量、作息和行为模式，并提醒持续不适应求助专业人士。
10. 不要照抄知识库原文，不要输出“给你的建议”这个独立模块。把具体建议自然融入牌阵深读、单牌行动提示和可能走向。
11. 语气清醒、具体、有温度。不要堆砌形容词，不要写套话。
12. 不出现“身心需要的是整合，不是一次性解决方案”“长期压力被内化”“大牌不是单一事件预测”“关注自己的感受”“保持积极心态”“相信自己的直觉”“一切都会好起来”等表达或近义空话。
13. 只输出一个合法 JSON 对象，不要代码围栏，不要 JSON 前后的解释。
"""


def _output_schema(card_count: int) -> str:
    notes = ", ".join(f'"第 {i + 1} 个位置的针对性判断"' for i in range(card_count))
    insights = ", ".join(
        (
            '{"body": "这张牌在此位置和此问题中的具体含义", '
            '"advice": "可执行行动", "relation": "与前后位置的联动", '
            '"prompt": "一个自我核对问题"}'
        )
        for _ in range(card_count)
    )
    return f"""{{
  "headline": "不超过28字的核心标题",
  "verdict": "直接回答问题的结论，180-320字",
  "reason": "为什么这样判断，100-220字",
  "keyPoints": ["关键启示1", "关键启示2", "关键启示3"],
  "cardNotes": [{notes}],
  "summary": "所有牌合起来如何回答这个问题，220-420字",
  "signals": [
    {{"label": "真实处境", "title": "短标题", "body": "具体分析"}},
    {{"label": "核心资源", "title": "短标题", "body": "具体分析"}},
    {{"label": "关键阻力", "title": "短标题", "body": "具体分析"}}
  ],
  "deepSections": [
    {{"title": "问题真正的难点", "body": "围绕提问者问题与牌阵结构展开"}},
    {{"title": "位置之间怎样互相影响", "body": "按本牌阵的框架分析牌与牌的联动"}},
    {{"title": "哪些条件会改变走向", "body": "指出可观察的现实信号与可变条件"}},
    {{"title": "接下来可以怎么做", "body": "整合3-5条具体、低成本、可执行的行动，不单列建议模块"}}
  ],
  "insights": [{insights}],
  "paths": [
    {{"label": "若维持惯性", "title": "短标题", "body": "可能延续的模式与代价"}},
    {{"label": "若主动调整", "title": "短标题", "body": "可改变走向的具体做法"}},
    {{"label": "关键观察点", "title": "短标题", "body": "如何用现实信号验证变化"}}
  ],
  "reflections": ["复盘问题1", "复盘问题2", "复盘问题3"],
  "disclaimer": "塔罗用于自我觉察，不构成医疗、法律、投资或其他专业建议。"
}}"""


def _format_card_context(card: dict[str, Any], position: dict[str, Any]) -> str:
    scenarios = card.get("scenarios") or {}
    scenario_lines = [
        f"- {scene}：{_clip(str(scenarios[scene]), 650)}"
        for scene in ("感情", "工作", "财务", "身心")
        if scenarios.get(scene)
    ]
    symbols = "；".join(card.get("symbols") or [])
    misconceptions = "；".join(card.get("misconceptions") or [])
    identity = f"{card.get('arcana') or '塔罗牌'}"
    if card.get("element"):
        identity += f"，{card['element']}元素"
    if card.get("number") is not None:
        identity += f"，数字/序号 {card['number']}"
    elif card.get("rank"):
        identity += f"，{card['rank']}"

    return "\n".join(
        [
            f"【第 {position.get('number')} 位：{position.get('name')}｜{card.get('name')}（{card.get('en')}）】",
            f"位置含义：{position.get('meaning') or '未提供'}",
            f"牌面身份：{identity}",
            f"一句话理解：{card.get('one_sentence') or '未提取'}",
            f"牌面符号：{_clip(symbols, 1500) or '未提取'}",
            f"正位解读：{card.get('upright') or '未提取'}",
            "问题场景的正位提示：",
            *(scenario_lines or ["- 未提取"]),
            f"常见误区：{_clip(misconceptions, 900) or '未提取'}",
            "提示：以上是知识摘录，不要照抄；必须转成对这个提问者、这个位置的具体判断。",
        ]
    )


def build_ai_prompt(
    question: str,
    spread: dict[str, Any],
    cards: list[dict[str, Any]],
) -> tuple[str, str]:
    spread_positions = spread.get("positions") or []
    card_context = "\n\n".join(
        _format_card_context(card, position)
        for card, position in zip(cards, spread_positions)
    )
    position_line = " → ".join(str(position.get("name") or "") for position in spread_positions)
    use_cases = "、".join(spread.get("useCases") or []) or "未提供"
    tips = "\n".join(f"- {tip}" for tip in spread.get("tips") or []) or "- 无额外提示"
    card_count = len(cards)
    user_prompt = f"""提问者的问题：
{question}

牌阵：
{spread.get('name')}（{card_count} 张牌，全部正位）
位置顺序：{position_line}
牌阵用途：{spread.get('summary')}
适合的问题：{use_cases}
知识库提示：
{tips}

知识库摘录：
{card_context}

请严格围绕这个问题和本牌阵结构完成解读。按以下 JSON 结构输出，字段不可缺；cardNotes 与 insights 必须各含 {card_count} 项，并与牌的位置顺序一一对应：
{_output_schema(card_count)}
"""
    return SYSTEM_PROMPT, user_prompt


def _extract_json(content: str) -> dict[str, Any]:
    text = content.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise ApiError("AI 未返回可解析的 JSON")
        try:
            value = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise ApiError("AI 返回的 JSON 格式不完整") from exc
    if not isinstance(value, dict):
        raise ApiError("AI 返回值不是 JSON 对象")
    return value


def _clean_text(value: Any, limit: int = 2000) -> str:
    if not isinstance(value, str):
        return ""
    value = re.sub(r"\s+", " ", value).strip()
    return _clip(value, limit)


def _string_list(value: Any, max_items: int, item_limit: int = 500) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        text = _clean_text(item, item_limit)
        if text and text not in result:
            result.append(text)
        if len(result) >= max_items:
            break
    return result


def _object_list(value: Any, max_items: int) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)][:max_items]


def load_spreads(kb_root: Path) -> list[dict[str, Any]]:
    """Load and validate the spread catalogue shipped with the knowledge base."""
    path = kb_root / SPREADS_FILE
    try:
        raw = json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError as exc:
        raise KnowledgeBaseError(f"牌阵知识库不存在：{path}") from exc
    except json.JSONDecodeError as exc:
        raise KnowledgeBaseError(f"牌阵知识库不是合法 JSON：{path}") from exc
    if not isinstance(raw, list) or not raw:
        raise KnowledgeBaseError("牌阵知识库为空")

    spreads: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            raise KnowledgeBaseError(f"第 {index + 1} 个牌阵格式不正确")
        spread_id = str(item.get("id") or "").strip()
        name = re.sub(r"\s+", " ", str(item.get("name") or "")).strip()
        try:
            card_count = int(item.get("cards"))
        except (TypeError, ValueError) as exc:
            raise KnowledgeBaseError(f"牌阵 {name or index + 1} 的牌数无效") from exc
        raw_positions = item.get("positions")
        if (
            not re.fullmatch(r"[a-z0-9-]+", spread_id)
            or not name
            or card_count < 1
            or card_count > 12
            or not isinstance(raw_positions, list)
            or len(raw_positions) != card_count
            or spread_id in seen
        ):
            raise KnowledgeBaseError(f"牌阵 {name or index + 1} 的字段不完整或重复")

        positions: list[dict[str, Any]] = []
        for pos_index, position in enumerate(raw_positions):
            if not isinstance(position, dict):
                raise KnowledgeBaseError(f"牌阵 {name} 的第 {pos_index + 1} 个位置格式不正确")
            pos_name = re.sub(r"\s+", " ", str(position.get("name") or "")).strip()
            pos_meaning = re.sub(r"\s+", " ", str(position.get("meaning") or "")).strip()
            if not pos_name or not pos_meaning:
                raise KnowledgeBaseError(f"牌阵 {name} 的第 {pos_index + 1} 个位置缺少名称或含义")
            positions.append(
                {
                    "number": pos_index + 1,
                    "name": _clip(pos_name, 40),
                    "meaning": _clip(pos_meaning, 180),
                }
            )
        if len({position["name"] for position in positions}) != card_count:
            raise KnowledgeBaseError(f"牌阵 {name} 的位置名称不能重复")

        spreads.append(
            {
                "id": spread_id,
                "name": _clip(name, 50),
                "cards": card_count,
                "summary": _clip(
                    re.sub(r"\s+", " ", str(item.get("summary") or "")).strip(),
                    500,
                ),
                "positions": positions,
                "useCases": _string_list(item.get("use_cases"), 8, 100),
                "steps": _string_list(item.get("steps"), 8, 220),
                "tips": _string_list(item.get("tips"), 6, 260),
                "tags": _string_list(item.get("tags"), 8, 30),
            }
        )
        seen.add(spread_id)
    return spreads


DOMAIN_RULES = (
    ("事业与成长", ("工作", "事业", "职场", "面试", "求职", "跳槽", "升职", "项目", "创业", "公司", "客户", "合作", "团队", "学业", "学习", "考试", "考研", "毕业", "论文", "实习", "转行", "副业", "辞职")),
    ("关系与情感", ("感情", "爱情", "恋爱", "喜欢", "暗恋", "对象", "前任", "分手", "复合", "暧昧", "婚姻", "结婚", "伴侣", "男朋友", "女朋友", "关系", "相处", "约会", "表白", "家庭", "家人")),
    ("金钱与资源", ("钱", "金钱", "财务", "财富", "收入", "工资", "奖金", "投资", "理财", "股票", "基金", "债务", "贷款", "买房", "消费", "预算", "经济", "生意", "盈利", "成本", "存款", "现金流")),
    ("自我与方向", ("选择", "方向", "人生", "未来", "改变", "成长", "自我", "迷茫", "决定", "坚持", "放下", "离开", "搬家", "旅行", "价值", "意义", "目标", "习惯", "勇气", "内耗", "纠结")),
    ("身心与状态", ("健康", "身体", "睡眠", "失眠", "疲惫", "焦虑", "压力", "情绪", "生病", "疾病", "健身", "饮食", "作息", "心理", "抑郁", "疼痛", "恢复", "精力", "倦怠", "放松", "疗愈")),
)


def classify_question(question: str) -> tuple[str, list[str]]:
    best_label = "综合议题"
    best_score = 0
    best_matches: list[str] = []
    for label, keywords in DOMAIN_RULES:
        matches = [keyword for keyword in keywords if keyword.lower() in question.lower()]
        score = sum(max(2, min(6, len(keyword))) for keyword in matches)
        if score > best_score:
            best_label = label
            best_score = score
            best_matches = matches
    return best_label, best_matches[:4]


def _api_messages(
    settings: Settings,
    question: str,
    spread: dict[str, Any],
    cards: list[dict[str, Any]],
) -> dict[str, Any]:
    system_prompt, user_prompt = build_ai_prompt(question, spread, cards)
    payload: dict[str, Any] = {
        "model": settings.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.65,
        "max_tokens": settings.max_tokens,
        "stream": False,
    }
    if settings.json_mode:
        payload["response_format"] = {"type": "json_object"}
    return payload


def call_ai(
    settings: Settings,
    question: str,
    spread: dict[str, Any],
    cards: list[dict[str, Any]],
) -> dict[str, Any]:
    if not settings.ai_configured:
        raise ApiError("AI 尚未配置，请在 .env 中填写 TAROT_API_KEY", HTTPStatus.SERVICE_UNAVAILABLE)

    body = json.dumps(
        _api_messages(settings, question, spread, cards),
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        settings.chat_endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "TarotReading/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.api_timeout) as response:
            raw = response.read(8 * 1024 * 1024)
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read(3000).decode("utf-8", errors="replace")
        except Exception:
            pass
        print(f"[AI] upstream HTTP {exc.code}: {detail[:1000]}", file=sys.stderr)
        if exc.code in {401, 403}:
            raise ApiError("AI 鉴权失败，请检查 API Key", HTTPStatus.BAD_GATEWAY) from exc
        if exc.code == 429:
            raise ApiError("AI 服务请求过于频繁或余额不足", HTTPStatus.TOO_MANY_REQUESTS) from exc
        raise ApiError(f"AI 服务返回 HTTP {exc.code}", HTTPStatus.BAD_GATEWAY) from exc
    except urllib.error.URLError as exc:
        print(f"[AI] upstream network error: {exc}", file=sys.stderr)
        raise ApiError("无法连接 AI 服务，请检查中转站地址或网络", HTTPStatus.BAD_GATEWAY) from exc
    except TimeoutError as exc:
        raise ApiError("AI 服务响应超时", HTTPStatus.GATEWAY_TIMEOUT) from exc

    try:
        upstream = json.loads(raw.decode("utf-8"))
        message = upstream["choices"][0]["message"]
        content = message.get("content", "")
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        if not isinstance(content, str) or not content.strip():
            raise KeyError("empty content")
    except (UnicodeDecodeError, json.JSONDecodeError, KeyError, IndexError, TypeError) as exc:
        print(f"[AI] malformed upstream response: {raw[:1200]!r}", file=sys.stderr)
        raise ApiError("AI 服务返回格式异常", HTTPStatus.BAD_GATEWAY) from exc
    return _extract_json(content)


def shape_reading(
    parsed: dict[str, Any],
    question: str,
    spread: dict[str, Any],
    cards: list[dict[str, Any]],
) -> dict[str, Any]:
    headline = _clean_text(parsed.get("headline"), 80)
    verdict = _clean_text(parsed.get("verdict"), 1200)
    reason = _clean_text(parsed.get("reason"), 900)
    if not headline or not verdict:
        raise ApiError("AI 返回内容缺少核心结论")

    card_count = len(cards)
    positions = spread.get("positions") or []
    notes = _string_list(parsed.get("cardNotes"), card_count, 700)
    if len(notes) < card_count:
        notes += ["这张牌的位置线索仍需结合牌面与问题进一步核对。"] * (
            card_count - len(notes)
        )

    key_points = _string_list(parsed.get("keyPoints"), 4, 120)
    summary = _clean_text(parsed.get("summary"), 1800) or verdict

    signals = []
    for index, item in enumerate(_object_list(parsed.get("signals"), 3)):
        signals.append(
            {
                "label": _clean_text(item.get("label"), 20) or f"线索 {index + 1}",
                "title": _clean_text(item.get("title"), 80) or "牌阵线索",
                "body": _clean_text(item.get("body"), 900),
            }
        )

    deep_sections = []
    raw_deep = _object_list(parsed.get("deepSections"), 5)
    for index, item in enumerate(raw_deep):
        title = _clean_text(item.get("title"), 100)
        body = _clean_text(item.get("body"), 1800)
        if title and body:
            deep_sections.append({"index": f"{index + 1:02d}", "title": title, "body": body})

    raw_insights = _object_list(parsed.get("insights"), card_count)
    insights = []
    for index, card in enumerate(cards):
        source = raw_insights[index] if index < len(raw_insights) else {}
        position = positions[index] if index < len(positions) else {}
        insights.append(
            {
                "position": position.get("name") or f"位置 {index + 1}",
                "positionMeaning": position.get("meaning") or "",
                "cardName": card.get("name") or "",
                "cardEn": card.get("en") or "",
                "keyword": "、".join((card.get("keywords") or [])[:3]) or "观察当下",
                "tag": card.get("tag") or "",
                "body": _clean_text(source.get("body"), 1800) or notes[index],
                "advice": _clean_text(source.get("advice"), 600),
                "relation": _clean_text(source.get("relation"), 600),
                "prompt": _clean_text(source.get("prompt"), 500),
            }
        )

    paths = []
    for index, item in enumerate(_object_list(parsed.get("paths"), 3)):
        paths.append(
            {
                "label": _clean_text(item.get("label"), 30) or ("可能走向 " + str(index + 1)),
                "title": _clean_text(item.get("title"), 100) or "观察变化",
                "body": _clean_text(item.get("body"), 1200),
            }
        )

    domain_label, matched_keywords = classify_question(question)
    major_count = sum(1 for card in cards if card.get("arcana") == "大牌")
    element_counts: dict[str, int] = {}
    for card in cards:
        element = str(card.get("element") or "").strip()
        if element:
            element_counts[element] = element_counts.get(element, 0) + 1
    element_text = " · ".join(f"{element} × {count}" for element, count in element_counts.items())

    return {
        "source": "ai-markdown",
        "theme": headline,
        "headline": headline,
        "domainLabel": domain_label,
        "modeLabel": "AI 深度解读",
        "matchedKeywords": matched_keywords,
        "directAnswer": {
            "verdict": verdict,
            "reason": reason,
            "keyPoints": key_points,
            "cards": [
                {
                    "position": (
                        positions[index].get("name")
                        if index < len(positions)
                        else f"位置 {index + 1}"
                    ),
                    "name": card.get("name") or "",
                    "orientation": "正位",
                    "note": notes[index],
                }
                for index, card in enumerate(cards)
            ],
        },
        "summary": summary,
        "stats": [
            {"label": "牌阵", "value": f"{spread.get('name') or '未命名'} · {card_count} 张"},
            {"label": "大阿卡纳", "value": f"{major_count} / {card_count}"},
            {"label": "元素分布", "value": element_text or "无"},
            {"label": "问题形态", "value": "AI 深度解读"},
        ],
        "signals": signals,
        "deepSections": deep_sections,
        "insights": insights,
        "paths": paths,
        "reflections": _string_list(parsed.get("reflections"), 4, 300),
        "disclaimer": _clean_text(parsed.get("disclaimer"), 300)
        or "塔罗用于自我觉察，不构成医疗、法律、投资或其他专业建议。",
    }


def deck_allows(deck_id: str, web_id: str) -> bool:
    if deck_id == "full":
        return True
    prefix, _, number = web_id.partition("-")
    if deck_id == "major":
        return prefix == "major"
    if deck_id == "minor":
        return prefix in KnowledgeBase.SUIT_ALIASES
    return prefix == deck_id and number.isdigit()


class TarotApp:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.kb: KnowledgeBase | None = None
        self.kb_error = ""
        self.spreads: list[dict[str, Any]] = []
        self.spreads_error = ""
        try:
            self.kb = KnowledgeBase(settings.kb_root)
        except Exception as exc:
            self.kb_error = str(exc)
            print(f"[KB] {self.kb_error}", file=sys.stderr)
        try:
            self.spreads = load_spreads(settings.kb_root)
        except Exception as exc:
            self.spreads_error = str(exc)
            print(f"[SPREADS] {self.spreads_error}", file=sys.stderr)
        self._api_slots = threading.BoundedSemaphore(4)

    def health(self) -> dict[str, Any]:
        return {
            "ok": True,
            "ai": {
                "configured": self.settings.ai_configured,
                "model": self.settings.model,
                "endpointHost": urllib.parse.urlparse(self.settings.chat_endpoint).netloc,
            },
            "knowledge": {
                "ready": bool(self.kb),
                "cards": self.kb.count if self.kb else 0,
                "root": self.settings.kb_root.name,
                "error": self.kb_error,
            },
            "spreads": {
                "ready": bool(self.spreads),
                "count": len(self.spreads),
                "error": self.spreads_error,
            },
        }

    def reading(self, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise ApiError("请求体必须是 JSON 对象", HTTPStatus.BAD_REQUEST)
        if not self.settings.ai_configured:
            raise ApiError("AI 尚未配置，请复制 .env.example 为 .env 并填写 API Key", HTTPStatus.SERVICE_UNAVAILABLE)
        if not self.kb:
            raise ApiError("知识库未就绪：" + self.kb_error, HTTPStatus.SERVICE_UNAVAILABLE)

        question = re.sub(r"\s+", " ", str(payload.get("question") or "")).strip()
        if len(question) < 2:
            raise ApiError("请填写具体问题", HTTPStatus.BAD_REQUEST)
        if len(question) > 500:
            raise ApiError("问题过长，请控制在 500 字以内", HTTPStatus.BAD_REQUEST)

        deck_id = str(payload.get("deckId") or "full")
        if deck_id not in ALLOWED_DECKS:
            raise ApiError("未知牌组", HTTPStatus.BAD_REQUEST)

        spread_id = str(payload.get("spreadId") or "").strip()
        spread = next((item for item in self.spreads if item["id"] == spread_id), None)
        if spread is None:
            raise ApiError("请选择知识库中的有效牌阵", HTTPStatus.BAD_REQUEST)

        drawn = payload.get("drawn")
        card_count = int(spread["cards"])
        if not isinstance(drawn, list) or len(drawn) != card_count:
            raise ApiError(
                f"“{spread['name']}”需要提交 {card_count} 张牌",
                HTTPStatus.BAD_REQUEST,
            )
        positions = spread["positions"]
        card_ids: list[str] = []
        for index, item in enumerate(drawn):
            if not isinstance(item, dict):
                raise ApiError("牌阵数据格式不正确", HTTPStatus.BAD_REQUEST)
            card_id = str(item.get("id") or "").strip()
            position = str(item.get("position") or "").strip()
            expected_position = positions[index]["name"]
            if position != expected_position:
                raise ApiError(
                    f"第 {index + 1} 张牌的位置应为“{expected_position}”",
                    HTTPStatus.BAD_REQUEST,
                )
            if not deck_allows(deck_id, card_id):
                raise ApiError(f"牌 {card_id} 不属于所选牌组", HTTPStatus.BAD_REQUEST)
            card_ids.append(card_id)
        if len(set(card_ids)) != card_count:
            raise ApiError(f"{card_count} 张牌不能重复", HTTPStatus.BAD_REQUEST)

        try:
            cards = [self.kb.read_card(card_id) for card_id in card_ids]
        except KnowledgeBaseError as exc:
            raise ApiError(str(exc), HTTPStatus.INTERNAL_SERVER_ERROR) from exc

        if not self._api_slots.acquire(blocking=False):
            raise ApiError("当前解读请求较多，请稍后再试", HTTPStatus.TOO_MANY_REQUESTS)
        started = time.monotonic()
        try:
            parsed = call_ai(self.settings, question, spread, cards)
            reading = shape_reading(parsed, question, spread, cards)
        finally:
            self._api_slots.release()
        elapsed_ms = round((time.monotonic() - started) * 1000)
        print(f"[AI] reading completed in {elapsed_ms} ms", file=sys.stderr)
        return {
            "ok": True,
            "reading": reading,
            "meta": {
                "model": self.settings.model,
                "latencyMs": elapsed_ms,
                "spreadId": spread["id"],
                "spreadName": spread["name"],
                "cardCount": card_count,
                "cards": [
                    {"id": card.get("web_id"), "name": card.get("name")} for card in cards
                ],
            },
        }


class TarotHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address: tuple[str, int], handler: type[SimpleHTTPRequestHandler], app: TarotApp):
        super().__init__(address, handler)
        self.app = app


class TarotRequestHandler(SimpleHTTPRequestHandler):
    server_version = "TarotReading/1.0"
    PRIVATE_SUFFIXES = {".env", ".py", ".bat", ".cmd", ".ps1"}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    @property
    def app(self) -> TarotApp:
        return self.server.app  # type: ignore[attr-defined]

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            self._send_json(HTTPStatus.OK, self.app.health())
            return
        if parsed.path == "/api/spreads":
            if not self.app.spreads:
                self._send_json(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    {
                        "ok": False,
                        "error": "牌阵知识库未就绪：" + self.app.spreads_error,
                    },
                )
                return
            self._send_json(
                HTTPStatus.OK,
                {"ok": True, "spreads": self.app.spreads},
            )
            return
        if parsed.path.startswith("/api/"):
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "接口不存在"})
            return
        decoded_path = urllib.parse.unquote(parsed.path)
        if any(part.startswith(".") for part in Path(decoded_path).parts) or (
            Path(decoded_path).suffix.lower() in self.PRIVATE_SUFFIXES
        ):
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "文件不存在"})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/reading":
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "接口不存在"})
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length <= 0 or content_length > 32 * 1024:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "请求内容为空或过大"})
            return
        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            result = self.app.reading(payload)
        except UnicodeDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "请求体不是 UTF-8 JSON"})
            return
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "请求体不是合法 JSON"})
            return
        except ApiError as exc:
            self._send_json(exc.status, {"ok": False, "error": str(exc)})
            return
        except Exception as exc:
            print(f"[SERVER] unhandled error: {exc!r}", file=sys.stderr)
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": "服务器处理失败"})
            return
        self._send_json(HTTPStatus.OK, result)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt: str, *args: Any) -> None:
        if self.path.startswith("/api/"):
            print(f"[HTTP] {self.address_string()} {fmt % args}", file=sys.stderr)


def _print_check(app: TarotApp) -> int:
    health = app.health()
    if app.kb:
        try:
            health["knowledge"].update(app.kb.validate_all())
            sample_ids = ("major-00", "wands-11", "pentacles-14")
            health["knowledge"]["samples"] = [
                {
                    "id": card_id,
                    "name": app.kb.get(card_id).get("name"),
                    "hasUpright": bool(app.kb.read_card(card_id).get("upright")),
                    "scenarios": sorted(app.kb.read_card(card_id).get("scenarios", {}).keys()),
                }
                for card_id in sample_ids
            ]
        except Exception as exc:
            health["ok"] = False
            health["knowledge"]["ready"] = False
            health["knowledge"]["error"] = str(exc)
    print(json.dumps(health, ensure_ascii=False, indent=2))
    return 0 if (
        health["ok"]
        and health["knowledge"]["ready"]
        and health["spreads"]["ready"]
    ) else 1


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    parser = argparse.ArgumentParser(description="塔罗抽牌本地服务")
    parser.add_argument("--port", type=int, default=None, help="HTTP 端口")
    parser.add_argument("--host", default=None, help="绑定地址")
    parser.add_argument("--check", action="store_true", help="检查知识库与配置后退出")
    args = parser.parse_args()

    settings = load_settings()
    if args.port is not None:
        settings = Settings(**{**settings.__dict__, "port": args.port})
    if args.host:
        settings = Settings(**{**settings.__dict__, "host": args.host})
    app = TarotApp(settings)
    if args.check:
        return _print_check(app)

    server = TarotHTTPServer((settings.host, settings.port), TarotRequestHandler, app)
    print(f"Tarot server: http://localhost:{settings.port}/index.html", flush=True)
    print(
        "AI: " + (f"configured ({settings.model})" if settings.ai_configured else "not configured; local reading only"),
        flush=True,
    )
    print(
        "Knowledge base: " + (f"{settings.kb_root} ({app.kb.count} cards)" if app.kb else f"ERROR: {app.kb_error}"),
        flush=True,
    )
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping...", flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
