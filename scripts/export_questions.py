# -*- coding: utf-8 -*-
"""
题库数据管线：从《人工智能训练师理论题库.xlsx》导出刷题数据。

步骤：
1. openpyxl 读取第一个 sheet（只读模式）。
2. 按真实表头（"试题内容" / "选项A".."选项F" / "试题答案"）定位列，找不到按位置
   （试题内容=3、选项=4..9、试题答案=10，1-based）兜底。
3. 主题分类：关键词规则 → 10 类之一；命中多主题按优先级取最高；未命中用二层宽泛词
   （fallback list）；仍无 → ai-basics（记为 fallback）。
4. explanation 零编造模板生成（只引用题干/选项文本，不引入外部事实）。
5. 题干哈希重复检测：输出重复组清单；同题干不同答案 → fail-fast 抛异常。
6. 校验 fail-fast：题目数==600、答案字母在选项内、题干/选项非空。
7. 输出 public/data/questions.json 与 .omc/state/question_bank_report.txt。

用法： python scripts/export_questions.py
"""

import hashlib
import json
import sys
from pathlib import Path

import openpyxl

# ---- 常量 ---------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
XLSX_PATH = BASE_DIR / "docs" / "人工智能训练师理论题库.xlsx"
JSON_OUT = BASE_DIR / "public" / "data" / "questions.json"
REPORT_OUT = BASE_DIR / ".omc" / "state" / "question_bank_report.txt"

EXPECTED_COUNT = 600

# 列名 → 位置兜底（1-based）
COL_FALLBACK = {
    "q": 3,        # 试题内容
    "opt_letters": ["A", "B", "C", "D", "E", "F"],
    "opt_start": 4,  # 选项A
    "opt_end": 9,    # 选项F
    "ans": 10,       # 试题答案
}

# 主题关键词（顺序即优先级：越靠前优先级越高，命中多个取最前）
TOPIC_PRIORITY = [
    ("dl-nn", [
        "神经网络", "深度学习", "卷积", "CNN", "RNN", "循环神经", "LSTM",
        "Transformer", "卷积核", "激活函数", "反向传播", "BP算法", "神经元",
        "注意力机制", "Attention", "预训练", "微调", "生成对抗", "GAN",
        "学习率", "批量", "Batch", "随机梯度", "优化器", "损失函数",
        "权重", "偏置", "全连接", "前馈", "特征图", "池化", "嵌入",
        "大模型", "模型架构", "过拟合的参数", "层数",
    ]),
    ("cv-vision", [
        "计算机视觉", "图像", "目标检测", "人脸识别", "OCR", "字符识别",
        "视频", "摄像头", "边缘检测", "语义分割", "视觉", "模板匹配",
        "车牌识别", "物体识别", "图像识别", "场景识别", "像素", "图片",
        "视觉模型", "标注图像",
    ]),
    ("nlp", [
        "自然语言", "NLP", "语音", "文本", "分词", "词性", "语法", "语义",
        "翻译", "对话", "语料", "情感分析", "机器翻译", "语音识别",
        "语音合成", "说话人", "文本生成", "聊天机器人", "大语言模型",
        "语言模型", "词嵌入", "语义相似", "问题回答",
    ]),
    ("ml-basics", [
        "机器学习", "监督学习", "无监督学习", "强化学习", "线性回归",
        "逻辑回归", "决策树", "随机森林", "KNN", "K近邻", "K-均值",
        "聚类", "支持向量机", "SVM", "朴素贝叶斯", "过拟合", "欠拟合",
        "训练集", "测试集", "验证集", "特征工程", "特征选择", "主成分",
        "PCA", "降维", "交叉验证", "泛化", "样本", "偏差", "方差",
        "正则化", "超参数", "模型选择", "数据拟合", "拟合",
    ]),
    ("data-labeling", [
        "标注", "标签", "数据清洗", "清洗", "数据质量", "抽样", "数据集",
        "数据采集", "图像标注", "框选", "标注工具", "多人标注", "标注规范",
        "一致性", "数据增广", "数据增强", "扩充", "标注员", "标注任务",
        "数据集构建", "数据准备", "数据管理", "数据预处理",
    ]),
    ("model-eval", [
        "准确率", "精确率", "召回率", "F1", "混淆矩阵", "AUC", "ROC",
        "评估", "评测", "指标", "阈值", "模型效果", "评估指标", "测评",
        "评估报告", "报告撰写", "验收",
    ]),
    ("python-prog", [
        "Python", "python", "编程", "代码", "函数", "变量", "数据类型",
        "列表", "字典", "循环", "条件", "import", "模块", "库", "pandas",
        "numpy", "matplotlib", "scikit-learn", "Sklearn", "print", "注释",
        "字符串", "整数", "浮点", "布尔", "脚本", "面向对象", "文件操作",
        "pip", "Jupyter", "Anaconda", "集成开发", "IDE",
    ]),
    ("ai-ethics", [
        "伦理", "道德", "偏见", "公平", "隐私", "安全", "合规", "备案",
        "法律法规", "法律", "责任", "透明", "可解释性", "监管", "滥用",
        "信任", "可信", "人类福祉", "社会影响", "虚假信息", "深度伪造",
        "数据安全", "算法歧视", "价值观", "个人信息", "隐私保护", "知情",
        "风险防控",
    ]),
    ("ai-apps", [
        "应用场景", "智能客服", "推荐系统", "自动驾驶", "机器人", "智慧",
        "医疗", "教育", "金融", "农业", "零售", "家居", "安防", "制造",
        "语音助手", "智能音箱", "人脸支付", "行业", "赋能", "智能化",
        "无人系统", "业务",
    ]),
    ("ai-basics", [
        "人工智能", "图灵", "智能体", "发展史", "寒冬", "基础概念",
        "起源", "历史", "前沿", "概述",
    ]),
]

# 二层宽泛关键词：第一层全部未命中时启用；命中则归对应类
FALLBACK_KEYWORDS = {
    "ml-basics": ["算法", "模型", "数据特征", "数据分布"],
    "data-labeling": ["数据", "样本集"],
    "model-eval": ["模型表现", "结果展示"],
    "python-prog": ["程序", "代码块"],
    "ai-apps": ["应用", "落地", "场景"],
    "ai-basics": ["智能", "AI", "概念", "基础", "知识"],
}

# 否定句式关键词（用于 explanation 追加说明）
NEGATION_KEYWORDS = ["不是", "不属于", "不包括", "错误", "不正确", "不符合"]

# 干扰项判定：非空选项数超过该数视为存在干扰项
DISTRACTOR_THRESHOLD = 2

OUT_TOPICS = sorted({t for t, _ in TOPIC_PRIORITY})


# ---- 工具函数 -----------------------------------------------------------

def norm_text(v):
    """单元格值 → 规范化字符串（去首尾空白、换行折成空格）。"""
    if v is None:
        return ""
    return str(v).replace("\r", " ").replace("\n", " ").strip()


def normalize_answer(v):
    """答案 → 去空白、非字母字符去除，返回大写字母串（如 'B'）。"""
    s = norm_text(v).upper()
    return "".join(ch for ch in s if ch.isalpha())


def bucket_by_priority(q_text):
    """按优先级从高到低匹配主题；未命中 → 二层宽泛词；仍无 → ('ai-basics', True)。"""
    for topic, kws in TOPIC_PRIORITY:
        if any(kw in q_text for kw in kws):
            return topic, False
    for topic, kws in FALLBACK_KEYWORDS.items():
        if any(kw in q_text for kw in kws):
            return topic, False
    return "ai-basics", True


def build_explanation(letters, raw_answer, options, q_text):
    """
    零编造 explanation：
    - 基础句：正确答案：<答案字母>（<选项原文>）。
    - 题干含否定句式或存在干扰项（非空选项数>阈值）时，追加仅指向选项原文的
      对照说明，不引入选项/题干之外的任何事实。
    """
    texts = []
    for l in letters:
        t = options.get(l, "")
        texts.append(f"{l}（{t}）" if t else l)
    base = f"正确答案：{'、'.join(texts)}。"

    has_neg = any(kw in q_text for kw in NEGATION_KEYWORDS)
    has_distractor = sum(1 for v in options.values() if v) > DISTRACTOR_THRESHOLD
    if has_neg:
        extra = "注意：本题为否定式设问，干扰项与正确项的区别见上方选项原文。"
        return base + extra
    if has_distractor:
        extra = "干扰项与正确项的区别见上方选项原文。"
        return base + extra
    return base


def fail(msg):
    print(f"[FAIL-FAST] {msg}", file=sys.stderr)
    sys.exit(1)


# ---- 主流程 -------------------------------------------------------------

def main():
    if not XLSX_PATH.exists():
        fail(f"找不到题库文件: {XLSX_PATH}")

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        fail("题库第一 sheet 为空")

    header = [norm_text(h) for h in rows[0]]

    # ---- 定位列：列名精确/包含匹配，找不到按位置兜底 ----
    def find_col(name, fallback_1based):
        for i, h in enumerate(header):
            if h and name == h:
                return i
        for i, h in enumerate(header):
            if h and name in h:
                return i
        return fallback_1based - 1

    q_col = find_col("试题内容", COL_FALLBACK["q"])
    ans_col = find_col("试题答案", COL_FALLBACK["ans"])
    opt_cols = {}
    for letter, col_1b in zip(COL_FALLBACK["opt_letters"],
                              range(COL_FALLBACK["opt_start"],
                                    COL_FALLBACK["opt_end"] + 1)):
        opt_cols[letter] = find_col(f"选项{letter}", col_1b)

    # ---- 调试门：打印表头与前 3 行原始值 ----
    print("=== DEBUG GATE: HEADER ===")
    print(header)
    print("=== DEBUG GATE: 前 3 行原始值 ===")
    n = 0
    for r in rows[1:]:
        if n >= 3:
            break
        # 编号非空才视为数据行
        if norm_text(r[0]):
            print(list(r))
            n += 1

    # ---- 读取数据行 ----
    records = []
    for row in rows[1:]:
        # 编号与题干均为空 → 跳过
        if not norm_text(row[0]) and not norm_text(row[q_col]):
            continue
        q = norm_text(row[q_col])
        if not q:
            continue
        rec = {
            "id": row[0],
            "q": q,
            "raw_answer": norm_text(row[ans_col]),
            "options": {},
        }
        for letter, col in opt_cols.items():
            text = norm_text(row[col])
            if text:
                rec["options"][letter] = text
        records.append(rec)

    # ---- 校验：题目数 == 600 ----
    if len(records) != EXPECTED_COUNT:
        fail(f"题目数 {len(records)} != {EXPECTED_COUNT}")

    # ---- 校验 fail-fast：题干/选项非空、答案在选项内 ----
    answer_ok = 0
    multi_select = 0
    for rec in records:
        q = rec["q"]
        letters = normalize_answer(rec["raw_answer"])
        if not letters:
            fail(f"题 {rec['id']} 答案为空或非字母: {rec['raw_answer']!r}")
        if len(letters) > 1:
            multi_select += 1
        for l in letters:
            if l not in rec["options"]:
                fail(
                    f"题 {rec['id']} 答案字母 {l} 不在选项内，"
                    f"选项={list(rec['options'].keys())}, 答案={rec['raw_answer']!r}"
                )
        if not q:
            fail(f"行 {rec['id']} 题干为空")
        answer_ok += 1

    # ---- 哈希重复检测：同题干不同答案 fail-fast ----
    dup_groups = []  # (q, [(id, letters), ...])
    conflict_found = None
    seen = {}
    for rec in records:
        key = hashlib.sha256(rec["q"].encode("utf-8")).hexdigest()
        item = (rec["id"], normalize_answer(rec["raw_answer"]))
        if key in seen:
            seen[key].append(item)
        else:
            seen[key] = [item]
    for key, items in seen.items():
        if len(items) > 1:
            dup_groups.append((key, items))
            answers = {a for _, a in items}
            if len(answers) > 1 and conflict_found is None:
                conflict_found = (key, items)
    if conflict_found:
        fail(
            f"同题干不同答案(冲突): {conflict_found[0]} -> {conflict_found[1]}"
        )
    dup_groups.sort(key=lambda g: min(i for _, i in g[1]))

    # ---- 主题分类 + explanation 生成 ----
    questions = []
    topic_counter = {}
    fallback_ids = []
    for rec in records:
        topic, is_fallback = bucket_by_priority(rec["q"])
        topic_counter[topic] = topic_counter.get(topic, 0) + 1
        if is_fallback:
            fallback_ids.append(rec["id"])
        letters = normalize_answer(rec["raw_answer"])
        explanation = build_explanation(letters, rec["raw_answer"],
                                        rec["options"], rec["q"])
        questions.append({
            "id": rec["id"],
            "topic": topic,
            "q": rec["q"],
            "options": rec["options"],
            "answer": letters,
            "explanation": explanation,
        })

    # ---- 输出 questions.json ----
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    # ---- 输出报告 ----
    REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append("题库数据管线报告 — export_questions.py")
    lines.append(f"生成时间: {__import__('datetime').datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"输入: {XLSX_PATH.name}")
    lines.append(f"输出: {JSON_OUT.relative_to(BASE_DIR)}")
    lines.append("")
    lines.append(f"题目数: {len(questions)}/{EXPECTED_COUNT} "
                 f"({'PASS' if len(questions) == EXPECTED_COUNT else 'FAIL'})")
    lines.append(f"答案合法率: {answer_ok}/{len(records)} "
                 f"({'PASS' if answer_ok == len(records) else 'FAIL'})")
    lines.append(f"多选题数: {multi_select}")
    lines.append("")
    lines.append("主题分布:")
    for topic in OUT_TOPICS:
        cnt = topic_counter.get(topic, 0)
        lines.append(f"  {topic:<14} {cnt:>4}")
    missing = {t for t in OUT_TOPICS if topic_counter.get(t, 0) == 0}
    lines.append(f"零命中主题: {sorted(missing) if missing else '无'}")
    lines.append("")
    lines.append(f"题干重复组: {len(dup_groups)} 组"
                 f"（同题干不同答案冲突: 0）"
                 f"（重复组答案一致: {sum(1 for g in dup_groups if len({a for _, a in g[1]}) == 1)}）")
    for key, items in dup_groups:
        q_text = None
        for rec in records:
            if hashlib.sha256(rec["q"].encode("utf-8")).hexdigest() == key:
                q_text = rec["q"]
                break
        ids = ", ".join(str(i) for i, _ in items)
        lines.append(f"  [{ids}] {q_text[:50] if q_text else '(?)'}")
    lines.append("")
    lines.append(f"未命中主题(关键词规则兜底到 ai-basics)的题目数: {len(fallback_ids)}")
    if fallback_ids:
        lines.append(f"  序号: {', '.join(map(str, fallback_ids))}")
    lines.append("")
    lines.append(f"校验结论: {'PASS' if (len(questions) == EXPECTED_COUNT and answer_ok == len(records)) else 'FAIL'}")

    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # ---- 汇总输出（供 lead 查看）----
    print("\n=== 汇总 ===")
    print(f"题目数: {len(questions)}/{EXPECTED_COUNT}")
    print(f"答案合法: {answer_ok}/{len(records)} | 多选: {multi_select}")
    print("主题分布: ", dict(sorted(topic_counter.items(), key=lambda kv: -kv[1])))
    print(f"重复组: {len(dup_groups)} 组 (冲突 0)")
    print(f"fallback 到 ai-basics: {len(fallback_ids)} 题")
    print(f"JSON 写出: {JSON_OUT}")
    print(f"报告写出: {REPORT_OUT}")
    print("校验结论: PASS")


if __name__ == "__main__":
    # 强制 UTF-8 输出，避免 Windows 控制台 GBK 乱码
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main()
