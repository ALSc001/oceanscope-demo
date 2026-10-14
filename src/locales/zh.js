import {guideZh} from './zh-guide.js';
import {detailZh} from './zh-details.js';
const pairs=`Workspace|工作区
Water-surface elevation MAE|水面高度 MAE
Water-surface elevation RMSE|水面高度 RMSE
Maximum elevation error|最大水面高度误差
Height paired coverage|高度配对覆盖率
GT reconstructible coverage|GT 可重建覆盖率
Paired trustworthy world-Y zero-crossing columns on common XZ lattice.|共同 XZ 网格上的可信世界 Y 零交叉配对列。
Not crest-to-trough wave height or Hs. Filled exterior, missing support and multiple crossings are excluded; inspect both coverage denominators.|不是波峰—波谷浪高或 Hs。排除水外填值、缺失支持与多重交叉；请查看两种覆盖率分母。
Same paired height columns.|相同的可信高度配对列。
Full-resolution aligned SDF, never preview mesh.|使用完整评分分辨率的对齐 SDF，不使用预览网格。
GT reconstructible columns.|GT 可重建的水平列。
Zero denominator: N/A. Not SDF voxel coverage.|分母为零时为 N/A，不是 SDF 体素覆盖率。
All candidate XZ columns.|全部候选 XZ 水平列。
Read with paired coverage to expose excluded GT surfaces.|与配对覆盖率一起阅读，显示 GT 表面被排除的比例。
OceanScope workspace|OceanScope 工作区
Wave Surface|水面查看
Field Compare|场比较
Results Library|结果库
User Guide|使用手册
— Wave Research Viewer|— 海浪科研查看器
— VDB Field Compare|— VDB 场比较
Open Alembic|打开 Alembic
↓ Export CSV|↓ 导出 CSV
Export CSV|导出 CSV
Dataset|数据集
Dataset name|数据集名称
Cross section|横截面
Along|沿
Reference level (HU)|参考水位（HU）
Meters per unit|每单位对应米数
Color range (m)|颜色范围（米）
Color minimum|颜色下限
Color maximum|颜色上限
Show section|显示截面
Wireframe|线框
Show highest-point marker|显示最高点标记
Compare profiles|比较截面曲线
Cached parameters|缓存参数
Current frame|当前帧
Maximum elevation|最高水面抬升
Section maximum|截面最大值
Section minimum|截面最小值
Section range|截面高度差
Surface profile|水面剖面
3D water surface|三维水面
Export maximum time series|导出最高点时间序列
Measurement definitions|测量定义
Play|播放
Pause|暂停
Frame|帧
Frames|帧数
Frame number|帧号
Frame slider|帧滑块
Time|时间
Speed|速度
Loop|循环
First frame|第一帧
Last frame|最后一帧
Previous frame|上一帧
Next frame|下一帧
Go to frame|跳转到帧
Preview FPS|预览帧率
Displayed frame|当前显示帧
Loading frame|正在加载帧
Loading measured geometry…|正在加载测量几何…
Selected Alembic file|已选 Alembic 文件
No file selected|未选择文件
Browse ABC file…|浏览 ABC 文件…
Advanced: enter a path|高级：输入路径
Advanced Alembic path|高级 Alembic 路径
Import ABC|导入 ABC
Importing Alembic|正在导入 Alembic
Cancel|取消
Close|关闭
Browse…|浏览…
Selecting…|正在选择…
Closing…|正在关闭…
Cancel / reset file picker|取消／重置文件选择器
Cancel removal|取消移除
Scientific field validation|科学场数据验证
Ground Truth versus Prediction|真实值与预测值比较
Ground Truth|真实值（GT）
Prediction|预测值
Selected VDB file or folder|已选 VDB 文件或文件夹
Browse VDB file…|浏览 VDB 文件…
Browse sequence folder…|浏览序列文件夹…
Advanced: enter a path or sequence pattern|高级：输入路径或序列格式
Advanced VDB path|高级 VDB 路径
Inspect VDB|检查 VDB
Inspecting…|正在检查…
Source|来源
Detected grids|检测到的网格
SDF field group|SDF 场组
Velocity field group|速度场组
SDF mapping incomplete|SDF 映射不完整
Velocity mapping incomplete|速度场映射不完整
Select SDF type before scoring|计算前请选择 SDF 类型
Enter truncation distance τ|输入截断距离 τ
Available|可用
Not available|不可用
Automatic SDF assessment|SDF 自动评估
Automatic SDF check|SDF 自动检查
Valid samples:|有效样本：
SDF validation mode|SDF 验证模式
Automatic — conservative|自动判断（保守）
Manual declaration — record reason|手动声明（需记录依据）
Override reason|手动覆盖依据
Generation method / confirmation from data author|生成方法／数据作者确认
Grid|网格
Grid(s)|网格
Mask|掩码
Mask:|掩码：
Unit|单位
Unit:|单位：
Type|类型
SDF type|SDF 类型
Full-domain SDF|全域 SDF
Water-interior distance / exterior unsupported|水体内部距离／水外不支持
Undetermined — preview available|尚未确定（可预览）
Velocity|速度场
SDF + Velocity|SDF ＋ 速度场
SDF only|仅 SDF
Velocity only|仅速度场
Review or override grid mapping|检查或修改网格映射
SDF grid|SDF 网格
SDF mask|SDF 有效掩码
Velocity vector grid|速度向量网格
Velocity X|X 方向速度
Velocity Y|Y 方向速度
Velocity Z|Z 方向速度
Velocity mask|速度有效掩码
Not mapped|未映射
Apply mapping|应用映射
View|查看
Remove|移除
Restore|恢复
only|单独
selection|选择
Confirm dataset removal|确认移除数据集
Create comparison|创建比较
SDF error evaluation region|SDF 误差评价区域
Full domain (valid pairs)|全域（双方有效样本）
GT water only (GT SDF < 0)|仅 GT 水体（GT SDF < 0）
Full domain|全域
GT water only|仅 GT 水体
SDF error region:|SDF 误差区域：
Conditional GT-water distance support|条件性 GT 水体距离有效区域
3D field comparison|三维场比较
Evaluation Metrics / Loss Definitions|评价指标／损失定义
Datasets & comparison setup|数据集与比较设置
Compared field|比较的场
SDF distance|SDF 距离
Velocity vector|速度向量
unit not declared|尚未声明单位
units undeclared|单位未声明
(unit undeclared)|（单位未声明）
inferred validity|推断的有效区域
Metrics:|指标：
Scores blocked:|无法计算：
Visualization available|可查看可视化
Not available for both datasets|两份数据未同时提供此场
No common field group|没有共同可用的场组
Dataset preview|数据集预览
3D field visualization|三维场可视化
Display controls|显示设置
3D display mode|三维显示模式
Preview quality|预览精度
Balanced · stride 2|均衡 · 步长 2
Fine · stride 1|精细 · 步长 1
Fast · stride 4|快速 · 步长 4
balanced|均衡
Ground Truth only|仅显示 GT
Prediction only|仅显示预测
Side by side · linked|并排 · 视角联动
Transparent overlay · blue / orange|透明叠加 · 蓝／橙
Solid + X-ray wireframe · overlap safe|实体＋透视线框 · 避免重叠遮挡
Surface opacity|表面透明度
Opacity|透明度
opacity|透明度
Visible layers|可见图层
Ground Truth (blue)|真实值（蓝色）
Prediction (orange)|预测值（橙色）
Show SDF context|显示 SDF 参考水面
Velocity display|速度显示
Speed magnitude|速度大小
Vector count limit|向量数量上限
Arrow scale|箭头缩放
Plane|平面
Slice plane|切片平面
Slice index|切片序号
Slice|切片
World:|世界坐标：
Fixed source color range|固定源数据颜色范围
Fit view|适配视图
3D zero-isosurface|三维零等值面
3D velocity field|三维速度场
GT · blue|GT · 蓝色
Prediction · orange|预测 · 橙色
GT · shared color scale|GT · 统一色标
Prediction · shared color scale|预测 · 统一色标
Synchronized slices & probe|同步切片与探针
Probe:|探针：
Magnitude / EPE|大小／EPE
Velocity EPE|速度 EPE
Frame metrics|单帧指标
Band:|带宽：
Maximum absolute error|最大绝对误差
Near-surface MAE|近表面 MAE
Sign accuracy|符号准确率
Fluid IoU|水体交并比（IoU）
Dice|Dice 系数
Symmetric mean surface distance|对称平均表面距离
Mean EPE|平均速度端点误差（EPE）
EPE RMSE|速度端点误差 RMSE
EPE P95|速度端点误差 P95
Relative L2|相对 L2 误差
Mean cosine similarity|平均余弦相似度
Mean angular error|平均角度误差
Divergence MAE|散度 MAE
Coverage|有效覆盖率
Valid voxels|有效体素数
Component MAE (x, y, z)|各分量 MAE（x、y、z）
Component RMSE (x, y, z)|各分量 RMSE（x、y、z）
Non-finite pairs excluded|排除的非有限值样本对
Near-surface voxels|近表面体素数
Surface samples (pooled)|合并的表面采样数
Angular exclusions|方向指标排除数
Divergence stencils|散度差分有效样本数
Trusted truncation τ|可信截断距离 τ
Effective band|有效带宽
fraction|比例
degrees|度
velocity / length|速度／长度
Processing fields|正在处理场数据
Comparison processing…|正在计算比较…
Comparison failed|比较失败
Field cache ready — scoring status below|场缓存已就绪，评分状态见下方
Available:|可用场：
Sequence loss analysis|序列误差分析
Per-frame metrics & sequence averages|逐帧指标与序列均值
Scoring blocked|计算被阻止
Complete sequence|序列完整
Partial results|部分结果
Review scoring setup|检查评分设置
Metric curve|指标曲线
Metric|指标
Context metric|参考指标
Mean|均值
Minimum|最小值
Maximum|最大值
Min|最小值
Max|最大值
Valid / total|有效／总数
Excluded|排除数
Sequence metric summary|序列指标汇总
Scrollable sequence summary|可滚动的序列汇总
Scrollable per-frame metrics|可滚动的逐帧指标
Per-frame metric values|逐帧指标值
Previous rows|上一页
Next rows|下一页
Page|页
Show current row|定位当前帧
Export all frames CSV|导出全部帧 CSV
Export sequence summary CSV|导出序列汇总 CSV
Export JSON|导出 JSON
Export VDB|导出 VDB
Export results|导出结果
Export aligned Prediction + Error VDB|导出对齐预测＋误差 VDB
VDB export path|VDB 导出路径
Alignment and provenance|对齐与数据来源
Canonical lattice|统一评价网格
Voxel size|体素大小
Policy|处理规则
Save research result|保存科研结果
Save Result|保存结果
Display name|显示名称
Model version|模型版本
Checkpoint|训练检查点
Notes|备注
Save annotations|保存备注
Export result ZIP|导出结果 ZIP
Back to library|返回结果库
REPRODUCIBLE EXPERIMENTS|可复现的实验记录
Search results|搜索结果
Model, GT, checkpoint or notes|模型、GT、检查点或备注
Compare selected|比较选中结果
Clear selection|清除选择
Select|选择
Prediction / model|预测／模型
Ground Truth / frames|GT／帧范围
Evaluation region|评价区域
Status / warnings|状态／警告
Saved at|保存时间
Actions|操作
Open|打开
Export ZIP|导出 ZIP
Not archived / unavailable|未归档／不可用
Save completed runs / recalculate source proofs|保存已完成计算／重新验证源文件
Save|保存
Recalculate|重新计算
Import historical comparisons|导入历史比较
Find historical results|查找历史结果
Import & save|导入并保存
MODEL EVALUATION|模型评估
Model Comparison|多模型比较
Common-support re-evaluation|共同有效区域重算结果
Original saved results|原始保存结果
Baseline|比较基线
Compare metric|选择比较指标
Recompute common support|重算共同有效区域
Show original results|显示原始结果
Export comparison ZIP|导出比较 ZIP
Models in this comparison|本次比较的模型
Remove from comparison|从本次比较移除
Loading saved metrics…|正在读取保存的指标…
Starting common-support calculation…|正在启动共同区域重算…
Model summary|模型汇总
Original mean|原始均值
Common-support mean|共同区域均值
Paired mean|配对帧均值
Baseline paired mean|基线配对帧均值
Δ vs baseline|相对基线差值 Δ
Improvement %|改善百分比
Improved / regressed / tied|改善／退步／持平帧数
Not ranked|暂不排名
Comparison frame|比较帧
Show synchronized 3D|显示同步三维视图
3D model|三维模型
All per-frame values (|全部逐帧数值（
Scoring protocol and provenance|计算规则与数据来源
Comparison Summary|比较结论
Comparison conclusion|比较结论
Copy English summary|复制中文结论
Key metric leaders|关键指标最优模型
Best model|最优模型
Metric conclusions and limitations|详细指标结论与限制
Full conclusion text · also included in comparison ZIP|完整结论文字（英文原文也包含在比较 ZIP 中）
Common scoring protocol|共同计算规则
Export chart SVG|导出图表 SVG
Export chart PNG|导出图表 PNG
Original values — not ranked|原始数值（不排名）
Manage datasets / recycle bin|管理数据集／回收站
Manage results / recycle bin|管理结果／回收站
Comparison history / recycle bin|比较历史／回收站
Active items|当前项目
Recycle bin|回收站
Refresh|刷新
Refresh items|刷新列表
Select all|全选
Clear|清空选择
Restore selected|恢复选中项目
Move selected to recycle bin|将选中项目移入回收站
Updating library…|正在更新列表…
Confirm library change|确认列表变更
Move to recycle bin?|移入回收站？
Restore selected items?|恢复选中项目？
Confirm|确认
removal|移除
restore|恢复
Calculation running|计算正在运行
Open model selection|打开模型选择
Export saved comparison ZIP|导出保存的比较 ZIP
Recycle bin is empty.|回收站为空。
No items.|暂无项目。
No matching results. Try another search.|没有匹配结果，请更换搜索内容。
No valid samples|没有有效样本
Not valid|无效
Not calculated|尚未计算
unknown|未知
units|单位
Preparing local task…|正在准备本地任务…
Processing locally|正在本地处理
Elapsed|已用时
Complete|完成
Running|运行中
Failed|失败
Interrupted|已中断
Partial|部分完成
Unavailable|不可用
Verifying original sources|正在验证原始数据
Verifying source content|正在验证源文件内容
Source content verified|源文件内容验证通过
Verifying sources after calculation|正在进行计算后的源文件验证
Calculating common-support metrics|正在计算共同区域指标
Common-support metrics|共同区域指标
Not directly comparable — values shown without ranking.|尚不能直接比较，仅显示数值，不排名。
Per-metric leaders on matching valid frames; no combined overall score.|仅在相同有效帧上比较各项指标，不合成总分。
Ranking pending: verify sources and recompute common support using the button above.|暂不排名：请先使用上方按钮验证源文件并重算共同有效区域。
Summary copied.|结论已复制。
Clipboard unavailable. Expand the text below to select and copy it.|剪贴板不可用，请展开下方文字手动选择并复制。
GT input content was not verified at calculation time|原计算未保存 GT 内容验证证明
Ground Truth content differs|GT 内容证明不一致
Recompute on a shared lattice, frame set and trustworthy support before ranking|请在统一网格、帧集合和可信有效区域上重算后再排名
Surface distances unavailable on common-support boundaries|共同区域边界不支持可靠的表面距离计算
No finite shared-support score for at least one model; check field availability, occupancy declarations and distance mode|至少一个模型没有有效共同区域得分；请检查场、内外占据声明和距离模式
Scores blocked: declare field semantics and units.|无法计算：请先声明场的物理含义和单位。
Metrics are not available for this frame.|当前帧没有可用指标。
units must be declared|必须声明单位
incompatible units|单位不一致
Mapping incomplete|映射不完整
manual override requires a recorded reason|手动覆盖需要填写依据
SDF type required|需要声明 SDF 类型
positive TSDF truncation distance required|TSDF 截断距离必须为正数
automatic SDF check is uncertain or unsafe; preview or review the data|SDF 自动检查无法确认安全性，请预览或检查数据
Global distance metrics require full SDF versus full SDF.|全域距离指标需要双方都是全域 SDF。
Unavailable for this frame/support; never substituted with zero.|当前帧／有效区域不可计算，不会以零代替。
Unavailable: no valid samples or zero GT energy.|不可计算：无有效样本或 GT 能量为零。
Declare semantics and units.|请声明物理含义和单位。
full|全域
water_interior|水体内部距离
length|长度
speed|速度
dimensionless|无量纲
inverseTime|时间的倒数
Context indicator; not a ranking score|参考指标，不用于排名
Lower|越低
Higher|越高
is better|越好`;
export const zh={...Object.fromEntries(pairs.split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]})),...detailZh,...guideZh};
