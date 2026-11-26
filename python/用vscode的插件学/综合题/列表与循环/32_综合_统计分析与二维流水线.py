# 第 32 题：统计分析与二维流水线（第四部分阶段综合）
# 所属部分：四、列表与循环；题型：阶段综合（考场函数模板补全 + 主流程串联）。
# 参考：课程课件 `lec4`、`lec6-compound-data-types.pdf`（`Statistics.py` 统计量、二维列表），
# 结合《Python语言程序设计基础（第3版）》（嵩天等）第 6/8 章、《Python编程：从入门到实践（第2版）》第 3/4/7 章，
# 对标《往年题》MOOC《基本统计值计算》、2026 春期中《奇偶数处理》与二维矩阵统计，改编题。
#
# 先学（本节整合第三、四部分核心细节与考场易错点）：
# 1. 样本统计量定义（对齐课件 `Statistics.py`）：
#    - 均值 x̄：所有数据之和除以个数 n（即总和 / n）。
#    - 样本标准差 s：当 n >= 2 时，公式为 √( Σ(xᵢ - x̄)² / (n - 1) )（注意分母是 n - 1 而非 n；开平方可用 ** 0.5 或 math.sqrt()）；当 n == 1 时无法除以 0，按约定返回 0.0。
#    - 中位数：将数值从小到大排序后，若 n 为奇数取正中间下标 n // 2 的值；若 n 为偶数取中间两个下标 n // 2 - 1 与 n // 2 的平均值。
#      ⚠️ **常见 Bug 警示**：课件示例中直接写 `sorted(numbers)` 却没有保存返回值，会导致下面取 `numbers[...]` 时仍是未排序顺序！正确做法是保存排序后的新列表，同时**不改坏**传入的原列表 `numbers`。
# 2. 保序去重与严格无尾逗号分隔：
#    - 遍历数据时可用成员判断 `x not in seen` 配合空列表收集，既能去重又能**保留首次出现的原始顺序**。
#    - `sep.join(iterable)`（其中 `iterable` 每个元素都必须是 `str`，如 `[str(x) for x in ls]`）只在元素之间插入 `sep`（如 `","`），天然保证末尾无多余分隔符。
# 3. 二维矩阵的深浅复制与按列遍历：
#    - 若要基于原矩阵 `grid` 复制出一份完全独立的同尺寸矩阵 `copy_grid`，可用推导式逐行复制：`[row[:] for row in grid]`，或先用 `[[0] * cols for _ in range(rows)]` 初始化后再双层循环赋值（切忌用 `[[0] * cols] * rows`）。
#    - 对 `rows` 行 `cols` 列矩阵按列统计时，外层固定列号 `j`（`0` 到 `cols - 1`），内层遍历行号 `i`（`0` 到 `rows - 1`），访问 `grid[i][j]`。
#
# 输入（分两段，勿打印输入提示）：
# 第 1 段：若干行原始文本，每行可能是一个整数字符串（允许带首尾空格）、小数或非法字符串，最后以一个**空行**（直接回车或纯空白行）终止本段读入。
# 第 2 段：空行之后紧跟 1 行两个正整数 `r c`（`1 <= r, c <= 10`）；再往后紧跟 `r` 行，每行 `c` 个空格分隔的整数，表示一个 `r × c` 二维整数矩阵。
#
# 输出与约束（禁止导入 `statistics`、`numpy` 等统计库；不得改动 `calc_stats` 函数名和参数表；按 exact 严格匹配，限时 2 秒）：
# 1. 请先补全下方函数 `calc_stats(nums)`：接收非空数值列表 `nums`，不得改变 `nums` 本身顺序，返回三元组 `(均值, 样本标准差, 中位数)`（若仅有 1 个元素，标准差返回 `0.0`）。
# 2. 第 1 行（筛选与保序去重）：从第 1 段空行前读入的所有文本中：
#    - 无法解析为**整数**的行（含小数如 `"3.5"` 或字母文本）全部跳过并计入无效行数 `bad_cnt`；
#    - 合法整数按读入顺序做**保序去重**（重复出现的合法整数直接跳过，**不计入** `bad_cnt`）。
#    若去重后有效整数个数为 `0`，输出 `0 bad=<bad_cnt> | NONE`；
#    否则输出 `<去重后有效整数个数> bad=<bad_cnt> | <用英文逗号 ',' 无空格拼接的去重整数>`。
# 3. 第 2 行（统计指标）：对上面得到的有效去重整数列表调用 `calc_stats`：
#    若有效列表为空，输出 `NONE`；否则输出 `mean=<均值:.2f> std=<标准差:.2f> med=<中位数:.2f>`。
# 4. 第 3 行（矩阵独立副本验证）：建立一个与原 `r × c` 矩阵互不干扰的独立矩阵副本，并将副本第 `0` 行第 `0` 列的元素加 `10`（不得影响原矩阵，也不得串改副本其余行），按行序输出副本每一行的元素之和（空格分隔）。
# 5. 第 4 行（原矩阵按列极值）：对未经修改的原 `r × c` 矩阵，按列序从第 `0` 列到第 `c - 1` 列分别求每一列的最大值，空格分隔输出。
#    （选做拓展提示：练完第 28～33 题后，也可自行尝试用 `turtle` 写一个“循环画多边形/同心正方形”脚本独立运行欣赏，不纳入本地评测。）
#
# 样例输入：
# 10
# abc
# 20
# 10
# 3.5
# 30
#
# 2 3
# 1 5 2
# 4 3 6
#
# 样例输出：
# 3 bad=2 | 10,20,30
# mean=20.00 std=10.00 med=20.00
# 18 13
# 4 5 6
# 说明：abc 与 3.5 为非法整数行(bad=2)，重复的第二个 10 仅跳过不计入 bad；副本首行首列+10后第一行变为11,5,2(和18)、第二行4,3,6(和13)；原矩阵三列最大值分别为4、5、6。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 如果在 `calc_stats(nums)` 中图省事直接调用原地排序后再取中位数，会给调用方带来什么潜在副作用？怎样既完成中位数计算又保住原列表？
# 2. 本题第 3 步如果改用 `[[0] * c] * r` 初始化副本矩阵并逐格赋值，会出什么问题？原因是什么？
#
# 评测：12 组测试集中在 评测/题库/32.json（重点自测空有效数据、仅有1个有效整数、负数与小数混入、重复数据、1x1 与非方阵二维表）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第32题”。
#
# -------- 请先补全下方函数体，再在下方完成主程序 --------
def calc_stats(nums):
    # 请在下面写你的代码，返回 (mean_val, std_val, median_val)：
    if nums :
        avg = sum(nums) / len(nums)
        a = 0
        for n in nums :
            a += pow((n - avg), 2)
        if len(nums) == 1 :
            std = 0.0
        else :
            std = pow(a / (len(nums) - 1), 0.5)
        tmp = sorted(nums)
        if len(nums) % 2 == 1 :
            med = tmp[(len(nums) - 1) // 2]
        else :
            med = (tmp[len(nums) // 2] + tmp[len(nums) // 2 -1]) / 2
        return [avg, std, med]
 

# 请在下面继续写主程序：

para1 = []
while True :
    cur = input().strip()
    if not cur :
        break
    para1.append(cur)
nums = [] # 保留全部数字
dedup = [] # 保留去重后数字
bad_cnt = 0
for s in para1 :
    try :
        nums.append(int(s))
        if int(s) not in dedup :
            dedup.append(int(s))
    except ValueError :
        bad_cnt += 1
out = ",".join([str(x) for x in dedup])
print(len(dedup), f"bad={bad_cnt}", "|", out if out else "NONE")

if not dedup :
    print("NONE")
else :
    mean, std, med = calc_stats(dedup)
    print(f"mean={mean:.2f} std={std:.2f} med={med:.2f}")

R, C = input().split()
r, c = int(R), int(C)
grid = []
for _ in range(r) :
    row = [int(x) for x in input().split()]
    grid.append(row)
dup = [row[:] for row in grid]
dup[0][0] += 10
sum_per_row = []
for row in dup :
    sum_per_row.append(sum(row))
print(*sum_per_row)
sum_per_col = []
for j in range(c) :
    mx = grid[0][j]
    for i in range(r) :
        mx = max(mx, grid[i][j])
    sum_per_col.append(mx)
print(*sum_per_col)

# 思考1：如果函数内直接对传入的 `nums` 做原地排序（`nums.sort()`），会直接改乱调用方外面的列表元素顺序（因为传参传入的是同一列表对象引用）；正确做法是用 `sorted(nums)` 生成排好序的新列表 `tmp`（或先浅拷贝 `nums[:]` 再排序），只读取 `tmp` 计算中位数从而保住原列表。
# 思考2：若用 `[[0] * c] * r` 初始化副本，外层 `* r` 只是把**同一个一维子列表的引用**复制了 `r` 份（所有行指向同一块内存）；逐格赋值或给第 0 行加 `10` 时，每一行会被后面写入的值或 `+10` 同步覆盖改坏，导致各行数据全变成最后一行或一起偏大。