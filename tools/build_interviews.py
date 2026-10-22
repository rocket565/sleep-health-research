# -*- coding: utf-8 -*-
"""
从《作业4》提取出的纯文本生成 assets/data/interviews.js。

为什么要用脚本：访谈原文必须与 docx 逐字一致，手抄会引入错字。
只要重新导出一份 dump 文本（见 README），重跑一次即可。

用法：
    python tools/build_interviews.py [dump路径]
默认读取 ../../_source/hw4_dump.txt（不入站，仅作生成源）。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
DEFAULT_SRC = os.path.join(HERE, "source", "hw4_dump.txt")
OUT = os.path.join(SITE, "assets", "data", "interviews.js")

LINE_RE = re.compile(r"^\[(\d+)\]\s*<[^>]+>\s?(.*)$")
INTERVIEW_RE = re.compile(r"^[一二三四五六七八九十]号被采访人：(.*)$")
TOPIC_RE = re.compile(r"^主题([一二三四五六七八九十]+)：(.*)$")
PURPOSE_RE = re.compile(r"^访谈目的：(.*)$")
QUESTION_RE = re.compile(r"^(\d+)\.\s*(.*)$")
FOLLOW_RE = re.compile(r"^追问：(.*)$")
CLOSING_RE = re.compile(r"^四、结尾")
SKIP_RE = re.compile(r"^(一、引言|二、暖场|三、主体|四、结尾)")

# 编辑信息：来自受访者自己的回答，用于列表卡片与详情页顶部
EDITORIAL = {
    "林梦依": {
        "subtitle": "本科在读 · 1:30 睡、7:30 起 · 下午补觉两小时",
        "summary": "困了就直接睡，但抖音和半夜开黑会让人越刷越亢奋；累到极致反而睡不着。她要的是强制锁定，不是温柔提醒。",
        "quote": "我喜欢强制锁定，因为温柔提醒对我不起作用。",
        "tags": ["睡前刷抖音", "半夜开黑", "忽略身体信号", "接受强制锁定"],
        "profile": [
            ("作息", "1:30 睡、7:30 起，下午补睡两小时"),
            ("自我认知", "睡眠质量挺好，困扰来自「睡前手机太好玩」"),
            ("睡眠环境", "完全没有影响，躺地上也能睡"),
            ("现有工具", "智能手表，只记录、不干预"),
        ],
    },
    "王君涵": {
        "subtitle": "备考英语六级 · 12:30 睡、9:00 起",
        "summary": "每天都计划早睡，但刷抖音刷到忘记；「事情没做完」的焦虑比「就是不想睡」更折磨人。",
        "quote": "我每天都计划早睡，但是刷抖音刷忘记了。",
        "tags": ["刷抖音忘记时间", "室友打呼噜", "事没做完更焦虑", "温和提醒"],
        "profile": [
            ("作息", "12:30 睡、9:00 起（近一周）"),
            ("自我认知", "没困意要躺很久，室友打呼噜影响入睡"),
            ("睡眠环境", "太亮、太热、室友打呼噜都会影响"),
            ("现有工具", "没用过，手环太贵"),
        ],
    },
    "孙明烨": {
        "subtitle": "电子信息工程 大四 · 12:00 睡、9:00 起",
        "summary": "作息相对规律，熬夜多是「就是不想睡」的随机行为；用手环监测睡眠，但只把数据当参考。",
        "quote": "推迟睡觉是我的随机行为，没有常规情况。",
        "tags": ["作息稳定", "只用手机看内容", "手环用户", "温和提醒"],
        "profile": [
            ("作息", "12:00 睡、9:00 起，一周七天都如此"),
            ("自我认知", "睡眠状态良好，没有什么困扰"),
            ("睡眠环境", "噪音和光线对入睡有较大影响"),
            ("现有工具", "手环，效果非常不错"),
        ],
    },
    "何烨辉": {
        "subtitle": "备考中 · 1–2 点睡、7:00 起",
        "summary": "推迟睡觉主要因为论文和报告没做完；用白噪音助眠、靠午休补觉，最在意数据会不会泄漏。",
        "quote": "需要完成论文或报告时会推迟睡觉。",
        "tags": ["论文/报告驱动", "白噪音助眠", "接受主动提醒", "在意隐私"],
        "profile": [
            ("作息", "1–2 点睡、7:00 起"),
            ("自我认知", "睡眠状态尚可，没有特别困扰"),
            ("睡眠环境", "在家比在宿舍更好入睡"),
            ("现有工具", "白噪音，助眠效果好"),
        ],
    },
}

SECTION_TITLES = {
    "二、暖场（Warm-up）": "暖场：你是谁、怎么睡",
    "三、主体（Main Body）": "主体",
}


def read_lines(path):
    with open(path, "r", encoding="utf-8") as fh:
        raw = fh.read().splitlines()
    out = []
    for line in raw:
        m = LINE_RE.match(line)
        if m:
            text = m.group(2).strip()
            if text:
                out.append(text)
    return out


def parse(lines):
    """把行序列解析成 [{name, warmup:[...], sections:[{title,purpose,items}]}]"""
    interviews = []
    cur = None
    mode = None          # "warmup" | "section"
    section = None
    item = None
    target = None        # 当前应填充的回答字段：("item"|"follow", obj)
    topic_index = 0
    in_closing = False

    for text in lines:
        m_int = INTERVIEW_RE.match(text)
        if m_int:
            cur = {"name": m_int.group(1).strip(), "warmup": [], "sections": []}
            interviews.append(cur)
            mode, section, item, target = None, None, None, None
            topic_index = 0
            in_closing = False
            continue
        if cur is None:
            continue

        if CLOSING_RE.match(text):
            in_closing = True
            mode, target = None, None
            continue
        if in_closing:
            continue

        if text.startswith("二、暖场"):
            mode, target = "warmup", None
            continue
        if text.startswith("三、主体"):
            mode, target = "section", None
            continue
        if text.startswith("一、引言"):
            mode, target = None, None
            continue

        m_topic = TOPIC_RE.match(text)
        if m_topic:
            topic_index += 1
            section = {"id": "t%d" % topic_index, "title": m_topic.group(2).strip(),
                       "purpose": "", "items": []}
            cur["sections"].append(section)
            mode, item, target = "section", None, None
            continue

        m_purpose = PURPOSE_RE.match(text)
        if m_purpose and section is not None:
            section["purpose"] = m_purpose.group(1).strip()
            continue

        m_q = QUESTION_RE.match(text)
        if m_q and mode in ("warmup", "section"):
            item = {"q": m_q.group(2).strip(), "a": "", "followups": []}
            if mode == "warmup":
                cur["warmup"].append(item)
            else:
                section["items"].append(item)
            target = ("item", item)
            continue

        m_f = FOLLOW_RE.match(text)
        if m_f and item is not None:
            follow = {"q": m_f.group(1).strip(), "a": ""}
            item["followups"].append(follow)
            target = ("follow", follow)
            continue

        # 其余为回答正文
        if target is None:
            continue
        kind, obj = target
        if kind == "item":
            obj["a"] = (obj["a"] + "\n" + text).strip() if obj["a"] else text
        else:
            obj["a"] = (obj["a"] + "\n" + text).strip() if obj["a"] else text
    return interviews


def build(src):
    parsed = parse(read_lines(src))
    out = []
    for idx, it in enumerate(parsed, start=1):
        meta = EDITORIAL.get(it["name"], {})
        sections = []
        for sec in it["sections"]:
            sections.append({
                "id": sec["id"],
                "title": sec["title"],
                "purpose": sec["purpose"],
                "items": sec["items"],
            })
        out.append({
            "id": idx,
            "name": it["name"],
            "subtitle": meta.get("subtitle", ""),
            "summary": meta.get("summary", ""),
            "quote": meta.get("quote", ""),
            "tags": meta.get("tags", []),
            "profile": [{"k": k, "v": v} for k, v in meta.get("profile", [])],
            "warmup": it["warmup"],
            "sections": sections,
            "images": [],
        })
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    data = build(src)
    header = (
        "/* ============================================================\n"
        " * 访谈原文（4 份）\n"
        " * 自动生成：python tools/build_interviews.py\n"
        " * 内容逐字来自《作业4》访谈记录，请勿手改正文；\n"
        " * 要补配图，在每份访谈的 images 数组里登记（见 README）。\n"
        " * ============================================================ */\n\n"
    )
    body = "window.INTERVIEWS = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(header + body)
    total_items = sum(len(s["items"]) for it in data for s in it["sections"])
    total_follow = sum(len(i["followups"]) for it in data for s in it["sections"] for i in s["items"])
    print("interviews:", len(data))
    for it in data:
        n = sum(len(s["items"]) for s in it["sections"]) + len(it["warmup"])
        print("  #%d %s  warmup=%d sections=%d items=%d images=%d" % (
            it["id"], it["name"], len(it["warmup"]), len(it["sections"]), n, len(it["images"])))
    print("total main items:", total_items, "followups:", total_follow)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
