/**
 * 实操指引模块 —— 三大实操赛题的数据（教程文案层）。
 *
 * 内容源（每条步骤 source 均指向 docs 下已核实存在的原始材料）：
 * - Python 编程：docs/实操练习/3.Python编程（test1/code1.py、test2/code.py、训练/code.py），
 *   docs/培训资料/3.Python编程（test1/实训资料1.docx、test2/实训资料2.docx）
 * - 模型构建：docs/实操练习/1.模型构建（test1-3.csv、实训资料1-3.pdf、2.人工智能模型训练实践.pdf、
 *   逻辑回归模型评价指标分析.pdf），docs/培训资料/2.模型构建（同名 docx）
 * - 数据标注：docs/实操练习/2.数据标注（test1/images、训练资料1-2.pdf、
 *   图像训练配置文件yaml的写法.pdf），docs/培训资料/4.数据标注（test1-2/labels、data.yaml、
 *   训练资料1-2.docx、图像训练配置文件yaml的写法.pdf）
 *
 * 结构约定：scenario = 考题立意；steps = 分步可执行操作（含来源标注）；
 * code = 基于原始 code.py 的精简注释版（Markdown fenced 代码块，可直接渲染）；
 * pitfalls = 考点与易错点。
 */
import type { HandsOnModule } from '../types'

export const HANDS_ON: HandsOnModule[] = [
  /* ==================== 模块一：Python 编程 ==================== */
  {
    id: 'python-prog',
    name: 'Python 数据标准化与相关性可视化实操',
    scenario:
      '全球AI产业高速扩张，企业需要依托标准化数据集完成薪资、技能、从业年限等维度的数据挖掘与可视化，输出行业发展报表；医院则需要依托临床数据集完成心脏病患病风险预测分析。本题即模拟此类场景：给定一份 CSV 数据集（test1 为财政/多元回归数据集，test2 为心脏病临床数据集），用 Python（Anaconda 中的 Spyder + pandas + sklearn + seaborn）完成"读取 → 描述性统计 → 数据标准化 → 特征相关性分析 → 可视化"的全流程，输出标准化分析报表与可视化图表。',
    purpose:
      '考查四类核心技能：(1) 用 pandas 读取 CSV 数据并做基础检查（head/describe）；(2) 用 sklearn 的 MinMaxScaler 做 0-1 归一化；(3) 用 df.corr() 计算相关性矩阵并用 seaborn 的 heatmap 绘制热力图、boxplot 绘制分布图；(4) 掌握数据标准化与可视化的基本规范，理解填空式考卷的补全技巧。',
    steps: [
      {
        title: '启动 Spyder 并打开源代码文件',
        detail:
          '启动 Anaconda 平台中的 Spyder 编程工具；点击菜单栏"打开文件"，选择题目规定路径下的 code.py（test1 为 code1.py），将源码导入 Spyder 的编程窗口。源代码为填空题：通过去掉某几行行首的 "#" 符号激活对应语句，并补全下划线处的代码。',
        source:
          'docs/培训资料/3.Python编程/test1/实训资料1.docx（① 数据集导入与特征描述性统计）、docs/实操练习/3.Python编程/test1/code1.py',
      },
      {
        title: '1.1 读取数据集（pd.read_csv）',
        detail:
          '第 1 步是读数据：用 pandas 的 read_csv 读取数据集并赋给变量 df，形如 df = pd.read_csv("data1.csv")。注意路径需与实际文件所在目录一致（题目运行环境建议用相对路径或题目规定路径）。',
        source:
          'docs/实操练习/3.Python编程/test1/code1.py 第 1.1 处下划线（注释行"# df = ___________1.1____________"），参考答案见 docs/实操练习/3.Python编程/训练/code.py 第 1-2 行',
      },
      {
        title: '1.2 预览前 5 行（df.head(n)）',
        detail:
          '去掉 1.2 处注释后补全：df.head(5)，输出数据集前 5 行预览。test1 要求前 5 行（参考第 6、10、13 行注释分布），test2 要求前 10 行，故推荐一律使用 df.head() 默认 5 行，并在代码中按题目要求改为 df.head(10)。',
        source:
          'docs/培训资料/3.Python编程/test1/实训资料1.docx（数据集前5行预览）、docs/实操练习/3.Python编程/训练/code.py（head(10)）',
      },
      {
        title: '1.3 描述性统计（df.describe()）',
        detail:
          '补全 df.describe()：输出数据基础特征统计（均值、标准差、最小/最大/四分位数等）。该结果用于快速确认各特征取值范围与数量级，判断是否需要标准化。',
        source:
          'docs/实操练习/3.Python编程/test1/code1.py 第 1.3 处下划线；参考 docs/实操练习/3.Python编程/训练/code.py 第 8 行',
      },
      {
        title: '2 数据标准化（MinMaxScaler 归一化）',
        detail:
          '先创建归一化工具，再对数据执行 0-1 标准化：scaler = MinMaxScaler() 后执行 scaler.fit_transform(数据)；再把结果转回 DataFrame 保留原列名（pd.DataFrame(df_scaled, columns=df.columns)）。test1 对全量数值列归一化；test2 只对指定数值列 age、trestbps、chol、thalach、oldpeak 归一化。',
        source:
          'docs/实操练习/3.Python编程/test2/code.py（numeric_cols 列表与 scaler 部分）、docs/实操练习/3.Python编程/训练/code.py 第 14-17 行、docs/培训资料/3.Python编程/test2/实训资料2.docx（② 数据标准化处理）',
      },
      {
        title: '3.1 特征相关性矩阵（df.corr()）',
        detail:
          '补全 df_scaled.corr()：计算归一化后数据各特征（及目标变量）之间的皮尔逊相关系数矩阵。注意一定要基于归一化后的 DataFrame 计算，且需先统一为 float 类型再调用 corr()，避免类型错误。',
        source:
          'docs/实操练习/3.Python编程/test1/code1.py 第 3.1 处下划线；参考 docs/实操练习/3.Python编程/训练/code.py 第 22 行（corr_matrix = df_scaled.corr()）',
      },
      {
        title: '3.2 热力图可视化（sns.heatmap）',
        detail:
          '补全 sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f")：annot 显示数值、cmap 指定配色（coolwarm 冷暖色）、fmt=".2f" 保留两位小数。坐标轴需设置中文字体 plt.rcParams["font.sans-serif"]="Arial Unicode MS" 与 plt.rcParams["axes.unicode_minus"]=False，防乱码与负号显示异常；最后用 plt.tight_layout() 与 plt.show() 渲染。',
        source:
          'docs/实操练习/3.Python编程/训练/code.py 第 19-29 行（中文设置与热力图）、docs/培训资料/3.Python编程/test1/实训资料1.docx（③ 特征相关性分析及数据可视化）',
      },
      {
        title: '补充：boxplot 箱线图与 scatterplot 散点图',
        detail:
          'test2 额外要求"临床特征与患病标签分布可视化"：sns.boxplot(data=df, x="target", y="age") 分特征观察患病/未患病两类人群的分布差异。训练版还给出 sns.scatterplot(x="x2", y="y", data=df_scaled) 验证特征与目标的关系。boxplot 的分布差异越明显（中位数位置不同），说明该特征区分力越强。',
        source:
          'docs/实操练习/3.Python编程/test2/code.py 第 32-38 行（boxplot 与 x2/y 散点图）、docs/实操练习/3.Python编程/训练/code.py 第 31-40 行',
      },
      {
        title: '运行并检查输出',
        detail:
          '保存文件后点击 Spyder 编程窗口"运行"菜单，右侧 Console 显示 print 输出与可视化图形。核对：数据集前 5 行预览、描述性统计表、归一化后数据预览、特征相关系数矩阵、热力图是否正常显示（若中文乱码则检查字体配置）。考试时还需将源代码截图、运行结果截图粘贴到答题 docx 中。',
        source:
          'docs/培训资料/3.Python编程/test1/实训资料1.docx（运行后编程窗口右边显示可视化结果）、docs/实操练习/3.Python编程/test2/code.py（print 语句）',
      },
    ],
    code: "```python\n# ============ Python 数据标准化与相关性可视化（基于训练/code.py 精简注释版） ============\nimport pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom sklearn.preprocessing import MinMaxScaler\n\n# 1. 读取数据集（1.1：pd.read_csv）\ndf = pd.read_csv(\"data.csv\")\n\n# 2. 数据基础信息与描述性统计（1.2 / 1.3）\nprint(\"数据集前10行：\")\nprint(df.head(10))        # df.head() 为前 5 行，本题要求前 10 行\nprint(\"\\n描述统计：\")\nprint(df.describe())\n\n# 3. 0-1 标准化（2：MinMaxScaler.fit_transform）\nscaler = MinMaxScaler()\ndf_scaled = scaler.fit_transform(df)\ndf_scaled = pd.DataFrame(df_scaled, columns=df.columns)\nprint(\"\\n归一化后预览：\")\nprint(df_scaled.head())\n\n# 4. 中文显示设置（防乱码，Windows 下也可用 SimHei）\nplt.rcParams[\"font.sans-serif\"] = \"Arial Unicode MS\"\nplt.rcParams[\"axes.unicode_minus\"] = False\n\n# 5. 特征相关性热力图（3.1 corr / 3.2 heatmap）\nplt.figure(figsize=(12, 9))\ncorr_matrix = df_scaled.corr()                     # 3.1\nsns.heatmap(corr_matrix, annot=True, cmap=\"coolwarm\", fmt=\".2f\")  # 3.2\nplt.title(\"特征相关性热力图\")\nplt.tight_layout()\nplt.show()\n\n# 6. 箱线图与散点图（test2 / 训练补充）\nplt.figure(figsize=(12, 6))\nsns.boxplot(data=df_scaled)                        # 各特征分布箱线图\nplt.title(\"标准化后箱线图\")\nplt.xticks(rotation=45)\nplt.tight_layout()\nplt.show()\n\nplt.figure(figsize=(8, 6))\nsns.scatterplot(x=\"x2\", y=\"y\", data=df_scaled)     # 特征 x2 与目标 y 的关系\nplt.title(\"x2与目标y散点图\")\nplt.tight_layout()\nplt.show()\n```",
    pitfalls: [
      '1.1 处读文件：必须用 pd.read_csv 而非 open/readlines——pandas 读入后才有 head/describe 等 API；路径写错会报 FileNotFoundError（考试用题目规定路径）。',
      '1.2 处 head 行数：默认 5 行，题目下标"前 10 行预览"明确要求 df.head(10)——行数与题目一致才能得分。',
      '2 处归一化：顺序不能倒——先 scaler = MinMaxScaler() 再 fit_transform；只对标准化的数值列（test2 的 numeric_cols）调用 transform，若 df 是混合类型需先选列；test1 全量数据均为数值可直接 fit_transform；注意转换成 DataFrame 时必须带 columns=df.columns，否则列名丢失。',
      '3.1 处 corr()：必须基于归一化后的 df_scaled（而非原始 df），且调用对象是 DataFrame——结果才是可绘制的矩阵。',
      '3.2 处 heatmap：参数含义记牢——annot=True 显数字、cmap="coolwarm" 配色、fmt=".2f" 保留两位小数；缺中文设置将出现方框乱码（Arial Unicode MS 是 macOS 字体名，Windows 换 SimHei 也可）。',
      'plt.xticks(rotation=45) 旋转 x 轴标签，避免长标签相互重叠；plt.tight_layout() 防止标题被截断，plt.show() 不写则看不到图。',
      '考试是补全代码（填空式），步骤顺序固定：读取→预览 describe→归一化→corr→heatmap，不要打乱；每题还有截图要求（源代码、预览、热力图），做完截图粘贴到答题文档。',
    ],
  },
  /* ==================== 模块二：模型构建 ==================== */
  {
    id: 'model-build',
    name: '逻辑回归模型构建与评价指标实操',
    scenario:
      '企业需要依托财政收入模拟数据集预测"财政收入增长是否达标"（revenue_growth_target 为 0/1 二分类），或依托临床数据集做心脏病患病风险预测。本题模拟此类场景：给定 test2.csv（含 year、revenue_growth_rate、tax_elasticity、fiscal_self_sufficiency、revenue_growth_target 等字段），先用 pandas 读取并处理数据，再用 sklearn 训练逻辑回归分类器，最后计算混淆矩阵与 precision/recall/F1 等评价指标并解读；同场景在 JASP 软件中还需要输出 Deviance、AIC、BIC、卡方、p 值等指标（见 2.人工智能模型训练实践.pdf）。',
    purpose:
      '考查五方面：(1) pd.read_csv 读取数据集并完成基础特征处理（选特征、去标识列、划分训练/测试集）；(2) 用 sklearn.linear_model.LogisticRegression 训练逻辑回归模型；(3) 计算理解混淆矩阵（TP/FP/FN/TN）与 accuracy、precision、recall、F1 的公式与含义；(4) 理解 ROC/AUC 与类别不平衡时的指标选择；(5) 拓充到 JASP 回归分析的五层次评价（整体显著性 P 值、R²/调整R²/RMSE、系数显著性、共线性诊断、残差分析）与逻辑回归的 Deviance/AIC/BIC/卡方/伪R² 体系。',
    steps: [
      {
        title: '1.1 读取数据并快速探查（pd.read_csv）',
        detail:
          '用 pd.read_csv("test2.csv") 读入，随后 df.head() 查看前几行、df.info() 检查字段类型与缺失、df.describe() 看各列取值范围。test2.csv 实际列为：year、revenue_growth_rate、tax_elasticity、fiscal_self_sufficiency、revenue_growth_target（目标标签，0/1）。',
        source:
          'docs/实操练习/1.模型构建/test2.csv（列名见文件头）、docs/实操练习/1.模型构建/实训资料2.pdf（② 模型运行与核心指标分析）',
      },
      {
        title: '1.2 特征选择与目标分离',
        detail:
          '确定特征 X 与目标 y：本题解释变量为 revenue_growth_rate（财政收入增速）等，被解释变量为 revenue_growth_target（是否达标）。注意剔除无意义的标识性列（如 year 不是解释变量——参考 JASP 题只选 revenue_growth_rate 与 fiscal_self_sufficiency 作解释变量）；用 X = df.drop("revenue_growth_target", axis=1) 与 y = df["revenue_growth_target"] 分离。',
        source:
          'docs/培训资料/2.模型构建/实训资料2.docx（① 逻辑回归模型参数设置：选取财政收入增速解释财政收入增长达标）、docs/实操练习/1.模型构建/test2.csv',
      },
      {
        title: '1.3 划分训练集与测试集（train_test_split）',
        detail:
          '用 sklearn.model_selection.train_test_split 按 7:3 划分（X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)），random_state 固定保证结果可复现。也可先用 StandardScaler 对特征标准化——与 Python 模块的 MinMaxScaler 同理。',
        source:
          'docs/培训资料/2.模型构建/逻辑回归模型评价指标分析.docx（p 值、Deviance 等项目）；数据标准化技法与 docs/实操练习/3.Python编程/训练/code.py 的 MinMaxScaler 一致',
      },
      {
        title: '2 训练逻辑回归模型',
        detail:
          '创建模型并训练：clf = LogisticRegression() 然后 clf.fit(X_train, y_train)。可用 clf.coef_ 查看系数（解释变量越大越倾向哪一类），用 clf.intercept_ 查看截距。若追求收敛稳定可将 max_iter 适当调大（默认 100，避免不收敛警告）。',
        source:
          'docs/实操练习/1.模型构建/2.人工智能模型训练实践.pdf（p15 JASP 实操：变量配置与统计设定）、docs/实操练习/1.模型构建/test2.csv',
      },
      {
        title: '3.1 模型预测（clf.predict）',
        detail:
          'y_pred = clf.predict(X_test) 预测测试集标签，y_pred_proba = clf.predict_proba(X_test)[:, 1] 取正类概率——predict 用于算混淆矩阵指标，predict_proba 用于画 ROC 曲线。',
        source:
          'docs/实操练习/1.模型构建/2.人工智能模型训练实践.pdf（p16 分类准确率与 ROC/AUC 曲线：输出概率才可画 ROC）',
      },
      {
        title: '3.2 混淆矩阵与 accuracy',
        detail:
          '计算 confusion_matrix(y_test, y_pred)：生成 2×2 矩阵（行=真实标签、列=预测标签，TN/FP/FN/TP 四象限）。accuracy = (TP+TN)/(TP+FP+TN+FN)，即 sklearn.metrics.accuracy_score。混淆矩阵是逻辑回归评价体系的基石——JASP 中同样输出"分类表"（混淆矩阵）。',
        source:
          'docs/培训资料/2.模型构建/逻辑回归模型评价指标分析.docx（第 7 项 Confusion Matrix 及其衍生指标）、docs/实操练习/1.模型构建/逻辑回归模型评价指标分析.pdf',
      },
      {
        title: '3.3 precision / recall / F1 计算与解读',
        detail:
          '用 sklearn.metrics.classification_report(y_test, y_pred) 一键输出三组指标+accuracy+macro avg：Precision = TP/(TP+FP)（预测为"达标"的样本中真正达标的比例）；Recall = TP/(TP+FN)（真实达标的样本中被找出的比例）；F1 = 2×P×R/(P+R)（两者调和平均，类别不平衡时最可靠）。生产场景中"漏检"（FN）代价更高时应更关注 Recall。',
        source:
          'docs/实操练习/1.模型构建/2.人工智能模型训练实践.pdf（p16 Accuracy/ROC/AUC 指标）、docs/培训资料/2.模型构建/逻辑回归模型评价指标分析.docx（Confusion Matrix 衍生指标）',
      },
      {
        title: '4 逻辑回归模型评价的 JASP 指标（进阶/考题延伸）',
        detail:
          '真题用 JASP 输出：Deviance（偏差，拟合损失，越小越好）、AIC/BIC（信息准则，越小越好，AIC 差值>2 算有实质差异，BIC 惩罚更重偏向简单模型）、似然比卡方（整个模型相对空模型是否显著）、p 值（p<0.05 模型整体显著）、回归系数 β、伪R²（McFadden/Nagelkerke/Cox-Snell）、混淆矩阵及 Accuracy（总体准确率）、ROC 曲线与 AUC（越接近 1 区分能力越强）。',
        source:
          'docs/培训资料/2.模型构建/逻辑回归模型评价指标分析.docx（1-7 项）、docs/实操练习/1.模型构建/2.人工智能模型训练实践.pdf（p16 指标）、docs/实操练习/1.模型构建/实训资料2.pdf（② 模型运行与核心指标分析）',
      },
      {
        title: '5 模型质量综合诊断（五层次评价法）',
        detail:
          '评价回归模型按五层次递进：(1) 整体显著性 P（P<0.05 有效）；(2) 解释力度 R²/调整R²（越接近 1 越好，多元回归看调整R²更客观）+ RMSE；(3) 单个变量回归系数 β 及其 t 检验 p 值；(4) 多元回归共线性诊断——条件指数>30 存在严重共线性、方差比例>0.5 判定变量，JASP 中也可看 VIF（>10 严重）与容忍度；(5) 残差分析——标准化残差直方图应呈钟形、Q-Q 图散点贴合直线，否则统计推断不可靠。多元比一元时要重点回答"加入新变量是否提升调整R²"。',
        source:
          'docs/实操练习/1.模型构建/2.人工智能模型训练实践.pdf（p7-p12 五层次评价、p11 共线性条件指数 30/方差比例 0.5）、docs/实操练习/1.模型构建/实训资料3.pdf（③ VIF/容忍度设置）',
      },
    ],
    code: "```python\n# ============ 逻辑回归训练与评价指标（基于 test2.csv） ============\nimport pandas as pd\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import (accuracy_score, confusion_matrix,\n                             precision_score, recall_score, f1_score,\n                             classification_report, roc_curve, roc_auc_score)\nimport matplotlib.pyplot as plt\n\n# 1. 读取城市财政收入模拟数据集（pd.read_csv）\ndf = pd.read_csv(\"test2.csv\")\nprint(df.head())\n\n# 2. 特征与目标：财政收入增速/财政自给率 -> 增长是否达标（0/1）\nX = df[[\"revenue_growth_rate\", \"fiscal_self_sufficiency\"]]  # 剔除 year 等标识列\ny = df[\"revenue_growth_target\"]\n\n# 3. 划分训练集/测试集（7:3，固定随机种子保证可复现）\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.3, random_state=42)\n\n# 4. 训练逻辑回归模型\nclf = LogisticRegression(max_iter=1000)\nclf.fit(X_train, y_train)\n\n# 5. 预测与评价\ny_pred = clf.predict(X_test)\ny_proba = clf.predict_proba(X_test)[:, 1]   # 正类概率（用于 ROC）\n\n# 6. 混淆矩阵（行=真实，列=预测：TN FP / FN TP）\ncm = confusion_matrix(y_test, y_pred)\nprint(\"混淆矩阵：\")\nprint(cm)\n\n# 7. 核心指标：accuracy / precision / recall / F1\nprint(f\"accuracy = {accuracy_score(y_test, y_pred):.4f}\")\nprint(f\"precision = {precision_score(y_test, y_pred):.4f}\")\nprint(f\"recall = {recall_score(y_test, y_pred):.4f}\")\nprint(f\"F1 = {f1_score(y_test, y_pred):.4f}\")\nprint(classification_report(y_test, y_pred))   # 一键输出全部指标\n\n# 8. ROC 曲线与 AUC（区分能力）\nfpr, tpr, _ = roc_curve(y_test, y_proba)\nprint(f\"AUC = {roc_auc_score(y_test, y_proba):.4f}\")\nplt.plot(fpr, tpr, label=f\"AUC={roc_auc_score(y_test, y_proba):.2f}\")\nplt.plot([0, 1], [0, 1], \"k--\")\nplt.xlabel(\"False Positive Rate\")\nplt.ylabel(\"True Positive Rate\")\nplt.legend()\nplt.show()\n```",
    pitfalls: [
      '特征选择要"干净"：test2.csv 的 year 是标识性列，不能当解释变量（真题只选 revenue_growth_rate 与 fiscal_self_sufficiency）；用 drop 前先确认目标列名（revenue_growth_target），不能把目标特征混进 X。',
      'train_test_split 不传 random_state 每次结果不同，考试截图对不上；test_size=0.3 默认即可。',
      '混淆矩阵行列含义：sklearn 约定 confusion_matrix(y_true, y_pred)，二分类默认顺序下为 [[TN, FP], [FN, TP]]——行=真实、列=预测，TP 位于右下；参数顺序写反或把列当成真实都会导致指标计算错误。',
      'precision 衡量"预测正例里有多少真的正例"、recall 衡量"真实正例里有多少被找出"，F1=2PR/(P+R)——三者都从混淆矩阵导出；类别极不平衡时（如 target 里 1 极少）accuracy 会虚高，此时看 F1 或 AUC。',
      'predict_proba 取列 1（正类概率）用于 ROC；不要拿 predict 的 0/1 去画 ROC。AUC 越接近 1 越强，0.5 意为随机。',
      'JASP 指标记忆桩：Deviance 越小拟合越好；AIC/BIC 只比大小没绝对线，AIC 差值>2 才算有差异，BIC 惩罚重、样本越大越倾向简单模型；似然比卡方看整体显著性；伪R² 有三兄弟（McFadden/Nagelkerke/Cox-Snell）不可交叉比较；共线性看条件指数>30、方差比例>0.5、VIF>10——常作为综合判断题出现。',
      '图形必须"可信"：残差直方图钟形、Q-Q 图散点贴合直线才说明残差满足正态假设；若散点剧烈偏离，说明模型假设（残差正态、线性、独立）不成立，不能下"模型合格"结论。',
    ],
  },
  /* ==================== 模块三：数据标注 ==================== */
  {
    id: 'data-label',
    name: 'YOLO 数据集标注与 data.yaml 配置文件实操',
    scenario:
      '制造业企业 / 智慧交通企业希望通过 YOLO 目标检测模型自动识别工人穿戴防护装备（防护防滑手套、护目镜）或安全帽、反光背心，为车间巡检与违规预警提供支持。本题模拟对该任务的数据准备环节：用 labelImg 对 50 张图像逐张做矩形框标注（YOLO 格式），再手工编写 data.yaml 训练配置文件——训练路径、验证路径、类别数量、类别名称缺一不可。',
    purpose:
      '考查四个关键点：(1) labelImg 标注工具的路径设置与 YOLO txt 格式切换；(2) 目标检测矩形框标注的规范（贴合目标、遮挡/极小可不标、类别名区分正负状态如 Gloves/No-Gloves）；(3) YOLO 标注文件 txt 的格式（class_id x_center y_center w h，全部 0-1 归一化，一行一个目标）；(4) data.yaml 的严格 YAML 语法（冒号后空格、空格缩进、nc 与类名顺序、后缀 .yaml 而非 .yaml.txt）。',
    steps: [
      {
        title: '1.1 启动 labelImg 并设置图片路径',
        detail:
          '打开 labelImg 软件，点击左侧"Open Dir"选择图片数据集文件夹（题目给出 images 目录路径，如 …/赛题2/images）；再点击"Change Save Dir"设置标注文件存放文件夹（…/赛题2/labels）——图片与标注文件分目录存放，且 labels 文件夹需与 images 同级（标签文件名与图像文件名同名、后缀 .txt）。',
        source:
          'docs/培训资料/4.数据标注/test1/训练资料1.docx（① 标注工具参数设置）、docs/实操练习/2.数据标注/test1/训练资料1.pdf（第 1 项）',
      },
      {
        title: '1.2 切换保存格式为 YOLO txt',
        detail:
          '在 labelImg 工具栏下拉框保存格式选择为 YOLO。若不切换，默认保存为 XML（PASCAL VOC 格式），无法直接用于 YOLO 训练——这是本题最易扣分的设置。切换后再开始标注，每张图像确认保存（Ctrl+S 或 D 键）会产生与图像同名、以 .txt 结尾的标注文件。',
        source:
          'docs/培训资料/4.数据标注/test1/训练资料1.docx（切换标注文件的保存格式为YOLO txt格式）、docs/实操练习/2.数据标注/test1/训练资料1.pdf（① 切换标注文件的保存格式为YOLO txt）',
      },
      {
        title: '2 对 50 张图像进行矩形框标注',
        detail:
          '逐张点击 Next Image 浏览图像，用鼠标框选目标物体，每框选一次为一个矩形标注。标注规范：(1) 类别选择准确——本题 4 类：1 Gloves（戴防护手套）、2 No-Gloves（未戴防护手套）、3 Goggles（戴护目镜）、4 No-Goggles（未戴护目镜），注意 No- 前缀表示"未戴"；(2) 矩形框尽量贴合目标主体；(3) 遮挡严重、目标极小或无法判断类别的目标可不标注（不标即可，不要乱框）。每完成一张点 Save 保存，共 50 张。',
        source:
          'docs/培训资料/4.数据标注/test1/训练资料1.docx（② 图像数据精准标注：类别列表、规范）、docs/实操练习/2.数据标注/test1/训练资料1.pdf（第 2 项：50 张图像、第1和25项截图）',
      },
      {
        title: '2.2 检查标注文件（txt 内容核对）',
        detail:
          '标注完后查看 labels 目录：每个图像应有同名 txt 文件（image01.jpg → image01.txt），无 txt 说明未保存或格式未切换。txt 每行一个目标：class_id x_center y_center width height，五个值以空格分隔——中心点坐标与宽高均为相对图像尺寸的 0-1 归一化值（x_center = 框左边 x + 框宽/2 再除以图像宽）。考试要求截图第 1 与第 25 个标注文件内容。',
        source:
          'docs/实操练习/2.数据标注/test1/训练资料1.pdf（② 查看50张图像标注文件的目录和内容）、docs/实操练习/1.模型构建/实训资料1.pdf（第1和25项标注文件的内容截图）、docs/培训资料/4.数据标注/test1/labels（参考目录结构与训练资料1.docx 对应）',
      },
      {
        title: '3.1 新建 data.yaml 并正确命名',
        detail:
          '新建文本文档 .txt，将其重命名为 data.yaml——必须把 .txt 后缀改成 .yaml（最终文件名 data.yaml），不能出现 data.yaml.txt。建议用记事本"另存为"对话框：文件名写 data.yaml、保存类型选"所有文件"，或直接打开空 data.yaml 编辑。',
        source:
          'docs/培训资料/4.数据标注/图像训练配置文件yaml的写法.pdf（第 1 节：新建文本文档重命名 data.yaml，后缀必须改）、docs/实操练习/2.数据标注/图像训练配置文件yaml的写法.pdf',
      },
      {
        title: '3.2 编写 data.yaml 内容',
        detail:
          '按 YOLO 规范填写五个核心字段（本题 4 类）：path 数据根目录；train 指向 images；val 也指向 images（本题未拆分训练/验证集，都填 images）；nc 为 4（类别数量）；names 下 0-3 行填入四类名称（顺序与 labelImg 中 classes.txt 保持一致，即 0:Gloves, 1:No-Gloves, 2:Goggles, 3:No-Goggles）。注意 YAML 语法：冒号后必须空格、缩进用空格不用 Tab、大小写严格（Gloves 不是 gloves，No-Gloves 中间横杠不能丢）。',
        source:
          'docs/培训资料/4.数据标注/图像训练配置文件yaml的写法.pdf（第 3 节示例内容：path/train/val/nc/names）、docs/培训资料/4.数据标注/test2/训练资料2.docx（③ 训练配置文件编辑：训练路径、验证路径、检测类别数量、四类类别名称）',
      },
      {
        title: '3.3 易错检查：语法与内容逐项核对',
        detail:
          '保存前核对：(1) 冒号后必须带一个空格——规范写法为 "nc: 4"、"path: ../赛题2"，写成 nc:4 无空格是错的；(2) names: 下面每一行前缩进 2 个空格（不能 Tab），每行格式"数字: 类别名"；(3) 类别名大小写与连字符完全匹配；(4) 文件后缀一定是 .yaml。完成后按要求将完整配置内容截图粘贴进答题文档。',
        source:
          'docs/培训资料/4.数据标注/图像训练配置文件yaml的写法.pdf（第 5 节注意事项：冒号空格、2空格缩进、大小写、nc:4、后缀）、docs/实操练习/2.数据标注/图像训练配置文件yaml的写法.pdf',
      },
      {
        title: '4 数据整体检查（标注合格性验证）',
        detail:
          '最后把 images 与 labels 目录层级对齐（两者同级、每个图像有对应 txt），可通过 Python 脚本核对：每个图像文件名是否都有同名 txt、txt 每行是否 5 个值、五个值是否都落在 [0,1]（归一化范围）、class_id 是否为 0-3 的整数（nc=4）。确认无误后截图目录与两份标注文件内容——考试评分点之一。',
        source:
          'docs/培训资料/4.数据标注/test1/训练资料1.docx（② 查看完成的50张图像标注文件的目录和内容）、docs/实操练习/1.模型构建/实训资料1.pdf（第② 50 张目录截图、第1和25项标注文件截图）',
      },
    ],
    code: "```python\n# ============ 数据标注检查脚本（核对 YOLO txt 标注与目录结构） ============\nimport os\n\nimages_dir = \"images\"   # 数据集图片目录\nlabels_dir = \"labels\"   # 标注文件目录\nNUM_CLASSES = 4         # 本题 4 类：0 Gloves / 1 No-Gloves / 2 Goggles / 3 No-Goggles\n\n# ======== data.yaml 参考内容（4 类目标，labelImg 标注后手写） ========\n# path: ../赛题2\n# train: images        # 图片目录（本题未拆分，train/val 均填 images）\n# val: images\n# nc: 4                # 类别数量（冒号后必须有空格）\n# names:               # 类别名称顺序必须与 labelImg classes 一致（大小写/连字符不能错）\n#   0: Gloves\n#   1: No-Gloves\n#   2: Goggles\n#   3: No-Goggles\n# ======================================================================\n\n# 1. 检查每个图片都有同名 .txt 标注文件\nimgs = sorted(f for f in os.listdir(images_dir)\n              if f.lower().endswith((\".jpg\", \".jpeg\", \".png\", \".bmp\")))\nmissing = []\nfor f in imgs:\n    label_file = os.path.join(labels_dir, os.path.splitext(f)[0] + \".txt\")\n    if not os.path.exists(label_file):\n        missing.append(f)\nprint(f\"图片总数: {len(imgs)} | 缺少标注: {len(missing)}\")\nif missing:\n    for f in missing[:5]:\n        print(\"  [缺失] \" + f)\n\n# 2. 校验 txt 格式：每行 = class x_center y_center w h，五点均归一化 [0,1]\nok_rows = 0\nbad = []\nfor f in imgs:\n    label_file = os.path.join(labels_dir, os.path.splitext(f)[0] + \".txt\")\n    if not os.path.exists(label_file):\n        continue\n    for i, line in enumerate(open(label_file, encoding=\"utf-8\"), 1):\n        parts = line.split()\n        if len(parts) != 5:\n            bad.append((f, i, \"列数 != 5\"))\n            continue\n        cid, cx, cy, w, h = parts\n        try:\n            vals = [float(x) for x in (cx, cy, w, h)]\n            icid = int(cid)\n        except ValueError:\n            bad.append((f, i, \"数值解析失败\"))\n            continue\n        if not (0 <= icid < NUM_CLASSES):\n            bad.append((f, i, f\"类别id超范围: {icid}\"))\n        elif not all(0.0 <= v <= 1.0 for v in vals):\n            bad.append((f, i, \"存在某值不在[0,1]\"))\n        else:\n            ok_rows += 1\nprint(f\"合法标注行数: {ok_rows} | 异常行数: {len(bad)}\")\nfor f, i, msg in bad[:5]:\n    print(f\"  [异常] {f} 第{i}行 -> {msg}\")\n\nprint(\"\\n结论: 若 [缺失]=0 且 [异常]=0，数据集可交付训练；否则先补齐/修正。\")\n```",
    pitfalls: [
      'labelImg 保存格式下拉框必须切到 YOLO，否则生成的是 XML 而非 txt——训练读不到；切换后每张图都用此格式 Save，遇到同名校验提示时确认覆盖即可。',
      '标注规范得分点：矩形框严格贴合目标主体；"未戴"类别（No-Gloves/No-Helmet）意味着在目标（手/头）处有框且类别选 No- 前缀，并非不做框；遮挡严重/目标极小/无法判断才不标，不要乱框一个宽框交差。',
      'class_id 顺序从 0 开始，不是 1——0:Gloves, 1:No-Gloves, 2:Goggles, 3:No-Goggles，与 data.yaml names 顺序必须完全一致。',
      'txt 内容五点归一化：class_id + 中心点(x,y) + 宽高 w、h，全部为 0-1 小数（除以原图宽/高），不是像素坐标；一行一个目标；空 txt（无目标）也合法但不能缺文件。',
      'data.yaml 笔误防线：冒号后必须带空格（nc: 4 而非 nc:4）、缩进用 2 个空格且不用 Tab、大小写严格区别（Gloves≠gloves）、No-Gloves 的连字符不能丢、nc 必须为 4、文件名后缀必须是 .yaml 而非 .yaml.txt。',
      'train/val 两条都填 images——本题未拆分训练集、验证集（yaml 写法 PDF 第 4 点），若填成 train 与 val 分开引路径会报路径错误；path 填数据集根目录。',
      '考试截图要求逐一完成：路径设置界面截图、切换界面截图、50 个标注文件目录截图、第 1 与第 25 个 txt 内容截图、data.yaml 完整内容截图，缺一扣分。',
    ],
  },
]
