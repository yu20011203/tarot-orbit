/* 塔罗星轨历史记录：抽牌页与历史页共用 */
(function () {
  "use strict";

  const STORAGE_KEY = "tarot-orbit-history-v1";
  const MAX_RECORDS = 24;
  const EVENT_NAME = "tarot-history-updated";

  function safeClone(value) {
    if (value == null) return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function readAll() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter(isUsableRecord) : [];
    } catch (error) {
      console.warn("历史记录读取失败：", error);
      return [];
    }
  }

  function isUsableRecord(record) {
    return Boolean(record && typeof record === "object" && record.id);
  }

  function sortRecords(records) {
    return records.slice().sort((left, right) => {
      return Number(right.createdAt || 0) - Number(left.createdAt || 0);
    });
  }

  function writeAll(records) {
    const normalized = sortRecords(records)
      .filter(isUsableRecord)
      .slice(0, MAX_RECORDS);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn("历史记录写入失败：", error);
    }
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { count: normalized.length }
      }));
    } catch (error) {
      // 自定义事件不可用时仍保留已经写入的数据。
    }
    return normalized;
  }

  function normalizeCards(cards) {
    return Array.isArray(cards) ? cards.map((card) => ({
      file: String(card && card.file || ""),
      zh: String(card && card.zh || ""),
      en: String(card && card.en || ""),
      pos: String(card && card.pos || ""),
      posMeaning: String(card && card.posMeaning || ""),
      orientation: String(card && card.orientation || "正位")
    })).filter((card) => card.file) : [];
  }

  function createId() {
    const random = Math.random().toString(36).slice(2, 8);
    return "reading-" + Date.now().toString(36) + "-" + random;
  }

  function save(record) {
    if (!isUsableRecord(record)) {
      throw new TypeError("无效的塔罗历史记录");
    }
    const now = Date.now();
    const existing = readAll();
    const previous = existing.find((item) => item.id === record.id);
    const next = {
      id: String(record.id),
      createdAt: Number(record.createdAt || previous?.createdAt || now),
      updatedAt: now,
      question: String(record.question || previous?.question || "未命名问题"),
      spreadId: String(record.spreadId || previous?.spreadId || ""),
      spreadName: String(record.spreadName || previous?.spreadName || "塔罗牌阵"),
      cards: normalizeCards(record.cards || previous?.cards),
      analysis: safeClone(record.analysis || previous?.analysis) || {},
      source: record.source === "ai" ? "ai" : "local"
    };
    const merged = [next, ...existing.filter((item) => item.id !== next.id)];
    writeAll(merged);
    return next;
  }

  function updateAnalysis(id, analysis, source) {
    const existing = readAll();
    const index = existing.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const record = existing[index];
    record.analysis = safeClone(analysis) || record.analysis || {};
    record.source = source === "ai" ? "ai" : record.source || "local";
    record.updatedAt = Date.now();
    existing[index] = record;
    writeAll(existing);
    return record;
  }

  function remove(id) {
    const next = readAll().filter((item) => item.id !== id);
    writeAll(next);
    return next;
  }

  function clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("历史记录清空失败：", error);
    }
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: 0 } }));
    } catch (error) {
      // 忽略事件派发失败。
    }
  }

  window.TarotHistory = Object.freeze({
    key: STORAGE_KEY,
    eventName: EVENT_NAME,
    maxRecords: MAX_RECORDS,
    list: () => sortRecords(readAll()).slice(0, MAX_RECORDS),
    save,
    updateAnalysis,
    remove,
    clear,
    createId
  });
})();
