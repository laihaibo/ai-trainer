/**
 * 实操练习栏目内容数据（/practice）。
 *
 * 与「实操指引」（handsOn.ts，纯教程）定位不同：本页是**真题 + 本人完成截图 + 逐条对照分析**。
 * 内容源（均已核实，docs/ 为本地资料不上线）：
 * - 模型构建：docs/实操练习/1.模型构建/实训资料1-3.pdf（题面），1-2/1-3/2-2/2-3/3-2/3-3.png
 *   （本人 JASP 完成截图，分析中的每个数值均取自截图实际输出）
 * - 数据标注：docs/实操练习/2.数据标注/图像训练配置文件yaml的写法.pdf
 * - Python 编程：docs/实操练习/3.Python编程/test1（实训资料1.pdf + code1.py + data1.csv）、
 *   test2（实训资料2.pdf + code.py + data2.csv）、训练/code.py（参考实现）
 *
 * 截图静态资源位于 public/images/practice/，页面用 import.meta.env.BASE_URL 拼接引用。
 */
import type {
  PracticeRegressionTask,
  PracticeYamlGuide,
  PracticePythonTask,
  PracticeExamCard,
} from '../types'

/* ==================== 子栏目一：模型构建（JASP 三题） ==================== */

export const REGRESSION_TASKS: PracticeRegressionTask[] = [
  {
    id: 'linear',
    kind: '线性回归',
    dataset: 'JASP · test1.csv（企业经营模拟数据集）',
    source: 'docs/实操练习/1.模型构建/实训资料1.pdf',
    requirements: [
      '① 导入 test1.csv，启用回归模块，选「部门月度运营投入 invest_hour」预测「部门月度利润 profit」，构建一元线性回归并完成核心参数设置',
      '② 运行模型，查看 R²、调整后 R²、回归系数、显著性 P 值，分析并精炼描述模型拟合效果',
      '③ 加入「市场推广费用 market_cost」构建多元线性回归；开启共线性诊断，输出残差直方图、标准化残差、标准化残差 Q-Q 图；查看 R²、调整后 R²、回归系数、P 值、共线性、残差分布并精炼描述',
    ],
    shots: [
      {
        src: '1-2.png',
        caption: '截图 1-2：一元线性回归结果（模型汇总 / 方差分析 / 系数）',
        analysis: [
          '对照①：结果标题为「线性回归 - profit」，注 M₁ includes invest_hour —— 因变量与解释变量选择正确，模型已按题目要求建立。',
          '对照②：模型汇总表给出了题目要求的全部核心参数——R=0.992、R²=0.984、调整后 R²=0.983，即 invest_hour 单独解释了 profit 约 98.4% 的变异，拟合优度极高；RMSE 从无模型时的 9.751 降到 1.259，预测误差大幅收窄。',
          '方差分析表：F=2892，p<.001 → 回归方程整体显著，线性关系成立。',
          '系数表：截距 9.371（p<.001）；invest_hour 非标准化系数 B=2.856（t=53.78，p<.001）→ 运营投入每增加 1 单位，部门月度利润平均增加约 2.856 单位；标准化系数 0.9918 接近 1，与 R² 互相印证。',
          '扣分风险：题目要求「分析并精炼描述」——只贴表不写文字结论不得分；描述必须点出 R²、回归系数含义、P 值显著性三要素。',
        ],
      },
      {
        src: '1-3.png',
        caption: '截图 1-3：多元线性回归结果（含共线性诊断与残差图）',
        analysis: [
          '对照③：注 M₁ includes invest_hour, market_cost —— 多元模型构建正确；共线性诊断表（Collinearity Diagnostics）、标准化残差直方图与 Q-Q 图均已输出，题目要求的选项一项不缺。',
          '拟合提升：R² 0.984→0.996、调整后 R²=0.996、RMSE 1.259→0.6155，F=6125（p<.001）→ 加入 market_cost 后解释力更强。',
          '系数异动（本题最大考点）：market_cost B=3.200（p<.001，标准化 0.9130）高度显著，但 invest_hour 的 p 值从一元的 <.001 变成 .251（不再显著），其标准化系数跌到 0.086。',
          '共线性判读：条件指数（Condition Index）第 3 维 =76.41（>30 即警戒），该维度上 invest_hour 与 market_cost 的方差比例同时高达 0.999 与 0.993 → 两解释变量间存在强多重共线性，正是它掩盖了 invest_hour 的独立效应。结论应写「方程整体显著但存在共线性，单个系数解释需谨慎」。',
          '残差判读：直方图整体近似钟形（叠加密度曲线贴合），左端 −3.5 附近有一个孤立柱；Q-Q 图散点基本贴着对角线，仅一个点偏离至约 (−2.3, −3.1) → 残差近似正态，存在个别离群样本。',
          '扣分风险：漏开共线性诊断或残差图直接丢步骤分；只报 R² 不解释「共线性导致 invest_hour 不显著」则分析分不完整。',
        ],
      },
    ],
    verdict:
      '三小问全部完成且截图要件齐全：一元模型 R²=0.984 拟合优秀，多元模型 R²=0.996 但共线性诊断暴露强共线性问题——分析时务必把「拟合优度高」与「条件指数 76.41、方差比例集中于同一维」两句都写进结论。',
  },
  {
    id: 'logistic',
    kind: '逻辑回归',
    dataset: 'JASP · test2.csv（城市财政收入模拟数据集）',
    source: 'docs/实操练习/1.模型构建/实训资料2.pdf',
    requirements: [
      '① 导入 test2.csv，选「财政收入增速 revenue_growth_rate」预测「财政收入增长达标 revenue_growth_target」，构建一元逻辑回归，开启混淆矩阵并输出 ROC 图',
      '② 运行模型，查看 Deviance、AIC、BIC、卡方 χ²、显著性 P 值、回归系数 β，分析并精炼描述拟合效果',
      '③ 加入「财政自给率 fiscal_self_sufficiency」构建多元逻辑回归，同样查看 Deviance、AIC、BIC、χ²、P 值、β 并精炼描述',
    ],
    shots: [
      {
        src: '2-2.png',
        caption: '截图 2-2：一元逻辑回归（模型汇总 / 系数 / 混淆矩阵 / ROC）',
        analysis: [
          '对照①：注 M₁ includes revenue_growth_rate，且 Performance Diagnostics 下有混淆矩阵、Performance plots 下有 ROC 图 → 题目要求的两个勾选项都已打开，要件齐全。',
          '对照②（模型汇总）：Deviance 41.59→30.42，AIC 43.589→34.419，BIC 44.990→37.222——三者都是「越小越好」，加入解释变量后同步下降；ΔX²=11.170（df=1，p<.001）→ 模型显著优于空模型。',
          '伪 R² 判读：McFadden R²=0.2686（经验上 >0.2 即拟合良好）、Nagelkerke R²=0.4145、Cox & Snell 0.3109 → 逻辑回归没有 R²，必须用这几个伪 R² 描述解释力，这是与线性回归答题的最大区别。',
          '系数：β=0.557（Wald=6.655，p=.010）；Odds Ratio=1.745 → 财政收入增速每提高 1 单位，「增长达标」的发生比（odds）变为原来的约 1.745 倍；截距 −5.922（p=.012）。',
          '混淆矩阵（cut-off=0.5，行=真实类别 Observed）：真实未达标（0）组 12 例判对、3 例误判为达标（判对率 80.00%）；真实达标（1）组 4 例误判、11 例判对（判对率 73.33%）→ Overall 76.67%；Performance metrics：Accuracy 0.7667、Sensitivity 0.7333、Precision 0.7857、AUC 0.8089（0.7~0.9 属可用/较好）；ROC 曲线明显拱向左上角。',
          '扣分风险：漏勾混淆矩阵或 ROC 各扣一步；把 Deviance/AIC 当成「越大越好」会得负分。',
        ],
      },
      {
        src: '2-3.png',
        caption: '截图 2-3：多元逻辑回归（两变量均显著，各指标全优）',
        analysis: [
          '对照③：注 M₁ includes revenue_growth_rate, fiscal_self_sufficiency → 多元模型正确。',
          '整体检验：Deviance 30.42→24.43、AIC 34.419→30.433、BIC 37.222→34.637 继续下降；ΔX²=17.156（p<.001）；McFadden R² 0.2686→0.4125、Nagelkerke 0.4145→0.5807 → 多元模型全面优于一元模型，这正是题目想让你写出的对比结论。',
          '系数：revenue_growth_rate β=0.584（OR=1.793，p=.025）、fiscal_self_sufficiency β=0.150（OR=1.162，p=.031）→ 两个变量都在 p<.05 水平显著，财政自给率同样对达标有正向贡献。',
          '判别表现：混淆矩阵 Overall 76.67%→83.33%（真实达标组判对 11→13、误判 4→2）；Accuracy 0.8333、Sensitivity 0.8667、Precision 0.8125、AUC 0.8844 → 判别能力进一步提升。',
          '扣分风险：只贴结果不做「一元 vs 多元」的 AIC/BIC/伪 R²/准确率对比，属于分析不完整。',
        ],
      },
    ],
    verdict:
      '两问截图要件齐全：一元模型 AUC 0.8089、准确率 76.67%，多元模型 AIC 更低、McFadden R²=0.4125、AUC 0.8844、准确率 83.33%——结论抓住「AIC/BIC/Deviance 越小越好、伪 R² 与 AUC 越大越好」双向对比即可拿满分析分。',
  },
  {
    id: 'poisson',
    kind: '泊松回归',
    dataset: 'JASP · test3.csv（新零售门店运营模拟数据集）',
    source: 'docs/实操练习/1.模型构建/实训资料3.pdf',
    requirements: [
      '① 导入 test3.csv，选「门店日均导购服务时长 service_hour」预测「门店日营收订单量 revenue_order」，构建一元泊松回归并完成核心参数设置',
      '② 运行模型，查看 Deviance、AIC、BIC、卡方 χ²、显著性 P 值、回归系数 β，分析并精炼描述拟合效果',
      '③ 加入 display_score、flow_cost 构建多元泊松回归；设置多重共线性选项中的「容忍度」与「VIF」；查看各核心参数及容忍度/VIF 并精炼描述',
    ],
    shots: [
      {
        src: '3-2.png',
        caption: '截图 3-2：一元泊松回归（广义线性模型输出）',
        analysis: [
          '对照①：JASP 中泊松回归需走「回归 → 广义线性模型」，结果标题「广义线性模型 / Model Summary - revenue_order」、注 H₁ includes service_hour → 模块与变量选择正确（分布选 Poisson、链接函数 log），这是本题最容易做错的一步（找不到入口就全盘做不出）。',
          '对照②（模型汇总）：Deviance 3.320×10⁷ → 2.526×10⁷ 下降，X²=7.941×10⁶（df=1，p<.001）→ 模型显著；AIC 2.527×10⁷、BIC 2.527×10⁷。',
          '系数：service_hour β=0.2913（z=2826，p<.001）。泊松为 log 链接，系数作用在对数尺度上：e^0.2913≈1.34 → 服务时长每增加 1 单位，期望订单量乘以约 1.34；截距 8.163 同理是 ln(期望订单量) 的基线。直接按「增加 0.29 单」解释是典型错误。',
          '研判：一元模型 Deviance 仍有 2.5×10⁷、AIC 与空模型差距相对有限 → 单一变量解释力不足，需要进入③补充协变量（这问埋着做多元的动机，描述里点出来更加分）。',
          '扣分风险：忘写「广义线性模型里选 Poisson 分布 + log 链接」的参数设置说明；不解释 e^β 的乘法效应。',
        ],
      },
      {
        src: '3-3.png',
        caption: '截图 3-3：多元泊松回归（含残差诊断图与容忍度/VIF）',
        analysis: [
          '对照③：系数表含 service_hour、display_score、flow_cost 三个协变量；Multicollinearity Diagnostics 表输出 Tolerance 与 VIF；并有 Residuals vs. Fitted 与 Q-Q 两张诊断图 → 题目要求的选项与图件全部到位。',
          '拟合飞跃：H₁ Deviance 从 2.526×10⁷ 骤降到 1038，AIC 2.527×10⁷→1.225×10⁴，X²=3.320×10⁷（p<.001）→ 三变量联合几乎解释了订单量的全部系统变异，模型显著改良。',
          '系数：service_hour 0.3001、display_score 0.5001、flow_cost 0.001000，全部 z 检验 p<.001 → 三个因素都显著；按 e^β 换算：陈列评分每 +1，订单量约乘 e^0.5≈1.65。',
          '共线性判读：Tolerance≈0.99（>0.1）、VIF≈1.00~1.01（<10 甚至 <5）→ 不存在多重共线性，模型结构健康。与线性回归一题（VIF 场景对照）形成考题反差，答「无共线性」要引用阈值依据。',
          '残差图：Standardized deviance residuals vs. fitted 散点围绕 0 线无系统趋势（小拟合值一侧点更密）；Q-Q 图散点紧贴对角线仅左尾微弯 → 残差分布合理。',
          '扣分风险：③没勾「容忍度/VIF」就缺一整块步骤分；诊断图未做文字解读同样扣分。',
        ],
      },
    ],
    verdict:
      '泊松题两步完整：一元模型显著但解释力不足（Deviance 2.5×10⁷），多元后 Deviance 降到 1038、VIF≈1.0 无共线性；关键表达是三句——log 链接下 e^β 是乘法效应、Deviance/AIC 越小越好、VIF<10 判无共线性。',
  },
]

/* ==================== 子栏目二：数据标注（data.yaml 教程页） ==================== */

export const YAML_GUIDE: PracticeYamlGuide = {
  title: 'YOLO 图像训练配置文件 data.yaml 的写法',
  source: 'docs/实操练习/2.数据标注/图像训练配置文件yaml的写法.pdf',
  steps: [
    '新建一个 文本文档.txt，重命名为 data.yaml —— 必须把后缀 .txt 改成 .yaml（隐藏了扩展名的 Windows 里先显示扩展名再改，改完是 data.yaml 而不是 data.yaml.txt）。',
    'YAML 语法极其严格：冒号后面必须带一个空格；缩进只能用空格、不能用 Tab 制表符；大小写敏感，不能乱加空格。',
    '按右侧示例填入数据集路径、train/val、类别数量 nc 与类别名称 names。',
    '本题数据集没有拆分训练集、验证集，所以 train 和 val 都填 images 文件夹。',
  ],
  sample: `# 数据集路径配置
path: ../赛题2   # 数据集的根目录（如 C:/Users/xxx/Desktop/人工智能训练师赛题资料/赛题2）
train: images   # 训练集文件夹，指向 images
val: images     # 验证集文件夹，指向 images

# 类别数量
nc: 4

# 类别名称，顺序必须和 labelImg 里 classes.txt 保持一致
names:
  0: Gloves
  1: No-Gloves
  2: Goggles
  3: No-Goggles`,
  fields: [
    { name: 'path', note: '数据集根目录（绝对或相对路径均可），train/val 在其下解析；写完核对拼写，路径错了训练直接报错。' },
    { name: 'train / val', note: '训练集与验证集子文件夹名。本赛题未拆分数据集，两者都填 images。' },
    { name: 'nc', note: '类别总数（number of classes），本例 4 类必须写 nc: 4，写错数量训练时标签越界报错。' },
    { name: 'names', note: '类别名称列表，顺序必须与 labelImg 生成的 classes.txt 完全一致（0 号、1 号……），否则标签错位，检出的“手套”会被标成“护目镜”。' },
  ],
  cautions: [
    '冒号后必须有一个空格：nc: 4 正确，nc:4 错误。',
    'names: 下面每一行前面缩进 2 个空格（不能用 Tab），数字冒号后同样要空格再写类别名。',
    '类别名称大小写必须完全匹配：是 Gloves 不是 gloves；No-Gloves 中间的横杠不能丢。',
    'nc 的数值必须与类别实际数量一致（本例是 4），不能写成其他数字。',
    '文件后缀必须是 .yaml，不是 .yaml.txt —— 改扩展名时注意系统是否隐藏了后缀。',
  ],
}

/* ==================== 子栏目三：Python 编程（填空真题 + 答案） ==================== */

export const PYTHON_TASKS: PracticePythonTask[] = [
  {
    id: 'py-test1',
    name: 'test1 · 财政数据集（多元回归分析报表）',
    scenario:
      '采用公开的财政数据集 data1.csv，依托 Spyder 完成数据读取、描述性统计、0-1 标准化、特征相关性分析与热力图可视化，输出标准化分析报表。代码为填空题：去掉指定行行首的 “#” 并补全下划线处代码。',
    source: 'docs/实操练习/3.Python编程/test1/实训资料1.pdf + code1.py',
    steps: [
      { title: '① 数据集导入与描述性统计', detail: '打开 code1.py，去掉第 6、10、13 行的 “#”，补全 1.1（读取财政数据集）、1.2（前 5 行预览）、1.3（基础特征统计）三处空位后运行。' },
      { title: '② 数据标准化处理', detail: '去掉第 19、22、25 行的 “#”，补全 2 处（对全量数据执行归一化），并预览归一化结果。' },
      { title: '③ 特征相关性分析与可视化', detail: '去掉第 28、31、35 行的 “#”，补全 3.1（相关性矩阵）与 3.2（热力图）两处空位后运行。' },
    ],
    lines: [
      'import pandas as pd',
      'import matplotlib.pyplot as plt',
      'import seaborn as sns',
      'from sklearn.preprocessing import MinMaxScaler',
      '# 1.读取多元回归数据集',
      '# df = pd.___________1.1____________',
      '',
      '# 打印数据集基础信息与描述性统计',
      'print("数据集前5行预览：")',
      '# print(df.___________1.2____________)',
      '',
      'print("\\n数据基础特征统计：")',
      '# print(df.___________1.3____________)',
      '',
      '# 2.初始化归一化工具，执行0-1标准化',
      'scaler = MinMaxScaler()',
      '',
      '# 对全量数据执行归一化处理',
      '# df_scaled = scaler.____________2____________',
      '',
      '# 将标准化数组转为DataFrame，保留原始列名',
      '# df_scaled = pd.DataFrame(df_scaled, columns=df.columns)',
      '',
      'print("\\n归一化后数据集预览：")',
      '# print(df_scaled.head())',
      '',
      '# 3.计算特征与目标变量的相关性矩阵',
      '# corr_matrix = df_scaled.____________3.1____________',
      '',
      'print("\\n特征相关系数矩阵：")',
      '# print(corr_matrix)',
      '',
      '# 绘制相关性热力图',
      'plt.figure(figsize=(12, 9))',
      '# sns._______________3.2_______________',
      "plt.title('多元回归数据集特征相关性热力图', fontsize=14)",
      'plt.tight_layout()',
      'plt.show()',
    ],
    blanks: [
      { no: '1.1', line: '# df = pd.___________1.1____________', answer: 'df = pd.read_csv("data1.csv")', note: 'pandas 读 CSV 只有 read_csv；文件名与题目规定路径一致，否则 FileNotFoundError。' },
      { no: '1.2', line: '# print(df.___________1.2____________)', answer: 'print(df.head(5))', note: '题干明确“前 5 行预览”。head() 默认虽是 5 行，考试建议显式写 head(5) 与题意对齐。' },
      { no: '1.3', line: '# print(df.___________1.3____________)', answer: 'print(df.describe())', note: '“数据基础特征统计”=描述性统计，唯一答案是 describe()（均值/标准差/分位数等）。' },
      { no: '2', line: '# df_scaled = scaler.____________2____________', answer: 'df_scaled = scaler.fit_transform(df)', note: 'test1 为全量数值列，直接对 df 做 0-1 归一化；先 fit 再 transform 一步到位就是 fit_transform。' },
      { no: '3.1', line: '# corr_matrix = df_scaled.____________3.1____________', answer: 'corr_matrix = df_scaled.corr()', note: '相关性矩阵必须基于归一化后的 df_scaled 计算（题目变量顺序已给好，只填方法名）。' },
      { no: '3.2', line: '# sns._______________3.2_______________', answer: 'sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f")', note: '热力图三参数：annot=True 格内显数值、cmap 配色、fmt=".2f" 保留两位小数——少一个都可能被扣展示分。' },
    ],
    fullAnswer: `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler

# 1. 读取多元回归数据集
df = pd.read_csv("data1.csv")

print("数据集前5行预览：")
print(df.head(5))
print("\\n数据基础特征统计：")
print(df.describe())

# 2. 初始化归一化工具，执行0-1标准化
scaler = MinMaxScaler()
df_scaled = scaler.fit_transform(df)
df_scaled = pd.DataFrame(df_scaled, columns=df.columns)

print("\\n归一化后数据集预览：")
print(df_scaled.head())

# 3. 计算特征与目标变量的相关性矩阵并绘制热力图
corr_matrix = df_scaled.corr()
print("\\n特征相关系数矩阵：")
print(corr_matrix)

plt.figure(figsize=(12, 9))
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f")
plt.title('多元回归数据集特征相关性热力图', fontsize=14)
plt.tight_layout()
plt.show()`,
  },
  {
    id: 'py-test2',
    name: 'test2 · 心脏病临床数据集（特征分布可视化）',
    scenario:
      '采用公开临床诊疗数据集 data2.csv，完成数据读取、前 10 行预览、描述性统计、对指定数值列的标准化，以及「患病/未患病人群核心临床特征分布」的箱线图可视化。同样是去 “#” + 补下划线的填空考法。',
    source: 'docs/实操练习/3.Python编程/test2/实训资料2.pdf + code.py',
    steps: [
      { title: '① 数据集导入与描述性统计', detail: '去掉第 8、12、15 行的 “#”，补全 1.1（读取心脏病数据集）、1.2（前 10 行预览）、1.3（基础特征统计）。' },
      { title: '② 数据标准化处理', detail: '去掉第 18、20、22、25、28 行的 “#”，补全 2 处：只对 numeric_cols 五个数值列做标准化并转回 DataFrame。' },
      { title: '③ 数据可视化设计', detail: '去掉第 32、35、38 行的 “#”，按 chol（血清胆固醇）、thalach（最大心率）与患病标签分布可视化的要求补全 3.1、3.2。' },
    ],
    lines: [
      'import pandas as pd',
      'import numpy as np',
      'import seaborn as sns',
      'import matplotlib.pyplot as plt',
      'from sklearn.preprocessing import MinMaxScaler',
      '',
      '# 1.读取心脏病临床数据集',
      '# df = ___________1.1_____________',
      '',
      '# 打印数据集基础信息与描述性统计',
      'print("数据集前10行预览：")',
      '# print(df._______1.2_________)',
      '',
      'print("\\n数据基础特征统计：")',
      '# print(df._______1.3_______)',
      '',
      '# 2.数据标准化处理',
      "# numeric_cols = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']",
      '',
      '# scaler = MinMaxScaler()',
      '',
      '# df_scaled_arr = scaler.____________2____________',
      '',
      '# 将标准化数组转为DataFrame，保留原始列名',
      '# df_scaled = pd.DataFrame(df_scaled_arr, columns=numeric_cols)',
      '',
      'print("\\n归一化后数据集预览：")',
      '# print(df_scaled.head())',
      '',
      '# 3.数据可视化',
      'plt.figure(figsize=(12, 8))',
      "# sns.boxplot(data=df, x='target', y='age')",
      '',
      '# 患病和未患病人群血清胆固醇（chol）分布差异可视化',
      '# sns._______________3.1_______________',
      '',
      '# 患病和未患病人群最大心率（thalach）分布差异可视化',
      '# sns.______________3.2_______________',
      '',
      "plt.title('心脏病患病标签与核心临床特征分布箱线图')",
      'plt.xticks(rotation=45)',
      'plt.tight_layout()',
      'plt.show()',
    ],
    blanks: [
      { no: '1.1', line: '# df = ___________1.1_____________', answer: 'df = pd.read_csv("data2.csv")', note: '本题空位没有 “pd.” 前缀提示，要连 pd.read_csv 一起写全——细心也是得分点。' },
      { no: '1.2', line: '# print(df._______1.2_________)', answer: 'print(df.head(10))', note: '题干要求“前 10 行预览”，必须显式 head(10)；照抄 test1 的 5 行直接扣分。' },
      { no: '1.3', line: '# print(df._______1.3_______)', answer: 'print(df.describe())', note: '同 test1：基础特征统计 = describe()。' },
      { no: '2', line: '# df_scaled_arr = scaler.____________2____________', answer: 'df_scaled_arr = scaler.fit_transform(df[numeric_cols])', note: '混合类型列必须先选出 5 个数值列：对整个 df 做 fit_transform 会因非数值列报类型错误。' },
      { no: '3.1', line: '# sns._______________3.1_______________', answer: "sns.boxplot(data=df, x='target', y='chol')", note: '仿照上一行 age 的示例，把 y 换成 chol：按 target（患病标签）分组比较血清胆固醇分布。' },
      { no: '3.2', line: '# sns.______________3.2_______________', answer: "sns.boxplot(data=df, x='target', y='thalach')", note: '同理 y 换成 thalach（最大心率）。两类箱子中位数差距越大，说明该特征对患病与否的区分力越强。' },
    ],
    fullAnswer: `import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler

# 1. 读取心脏病临床数据集
df = pd.read_csv("data2.csv")

print("数据集前10行预览：")
print(df.head(10))
print("\\n数据基础特征统计：")
print(df.describe())

# 2. 数据标准化处理（只处理数值列）
numeric_cols = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
scaler = MinMaxScaler()
df_scaled_arr = scaler.fit_transform(df[numeric_cols])
df_scaled = pd.DataFrame(df_scaled_arr, columns=numeric_cols)

print("\\n归一化后数据集预览：")
print(df_scaled.head())

# 3. 数据可视化：患病/未患病人群核心临床特征分布
plt.figure(figsize=(12, 8))
sns.boxplot(data=df, x='target', y='age')
sns.boxplot(data=df, x='target', y='chol')
sns.boxplot(data=df, x='target', y='thalach')
plt.title('心脏病患病标签与核心临床特征分布箱线图')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
  },
]

/** Python 编程高频考点与难点（依据两套题 + 训练版 code.py 归纳，编号①-④对应考点/难点分类） */
export const PYTHON_CARDS: PracticeExamCard[] = [
  {
    title: '考点① 数据读取与预览：read_csv / head(n) / describe()',
    points: [
      '三个方法固定连用：读取 → head 预览 → describe 描述统计，顺序不能乱，是填空题的 1.1-1.3 三连。',
      'head 的行数必须与题干一致：test1 要求前 5 行、test2 要求前 10 行——出题人最爱在数字上设扣分点。',
      '空位若带 “pd.” 前缀只填 read_csv；不带前缀要写全 pd.read_csv("文件名.csv")，看清卷面提示再下笔。',
    ],
  },
  {
    title: '考点② 0-1 标准化：MinMaxScaler 两步走',
    points: [
      '固定套路：scaler = MinMaxScaler() → scaler.fit_transform(数据) → pd.DataFrame(结果, columns=原列名) 转回 DataFrame。',
      '转回 DataFrame 时 columns 不能省（df.columns 或 numeric_cols），列名丢了后续 corr 与图表全不可读。',
      '归一化结果是 [0,1] 区间：最小值变 0、最大值变 1，检查预览即可自证做对了。',
    ],
  },
  {
    title: '考点③ 相关性矩阵与热力图：corr() + heatmap()',
    points: [
      'corr() 必须作用在归一化后的 DataFrame 上（df_scaled.corr()），对原始 df 计算属于流程错误。',
      'heatmap 参数组合是高频默写点：sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f")。',
      '配齐 plt.figure / title / tight_layout / show 四件套，show() 不写则图不显示、截图环节直接失分。',
    ],
  },
  {
    title: '考点④ 分组分布可视化：boxplot 按标签分组',
    points: [
      'test2 的 3.1/3.2 是「换参数仿写」：照抄上一行 sns.boxplot(data=df, x="target", y=...)，只换 y 列名（chol、thalach）。',
      '读图口径：两组箱子中位数/四分位差距越大，该临床特征对患病标签的区分力越强——描述性结论要会写。',
      'xticks(rotation=45) 防标签重叠，属于卷面细节分。',
    ],
  },
  {
    title: '难点① 全量归一化 vs 选列归一化（两题最大差异）',
    points: [
      'test1 数据集全是数值列：scaler.fit_transform(df) 直接整体归一化。',
      'test2 含分类列：必须 scaler.fit_transform(df[numeric_cols]) 先选 5 个数值列；对混合类型 DataFrame 整体调用会报 ValueError——两套题共用一个模板就会翻车。',
      '判断方法：先 describe()/head 看列类型，混合类型必选列。',
    ],
  },
  {
    title: '难点② 中文字体与运行环境配置',
    points: [
      '图表标题是中文时需设 plt.rcParams["font.sans-serif"]（Windows 用 SimHei，macOS 用 Arial Unicode MS）与 plt.rcParams["axes.unicode_minus"]=False，否则标题变方框、负号消失。',
      '训练版 code.py 里的字体名是 macOS 的 “Arial Unicode MS”（还带了一个尾随空格），考试在 Windows/Spyder 环境应改用 SimHei——字体名不是得分点，但图中文乱码会影响截图判定。',
      '填空题只动指定行：去掉行首 # 与补下划线之外，不要改题目既有代码结构，改动越多阅卷风险越高。',
    ],
  },
  {
    title: '难点③ 交卷流程：先跑通，再逐项截图',
    points: [
      '按题干截图清单核对交件：源代码截图、数据预览截图、描述统计截图、归一化预览、相关系数矩阵、热力图（test2 为三张箱线图）——先完整跑通再补图，避免截到报错中间态。',
      '截图与小题编号一一对应粘贴进答题 docx，路径、编号按题目规定整理，漏一项丢一项的步骤分。',
    ],
  },
]
