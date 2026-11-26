# 第 33 题：双序列算法与边界仲裁（第四部分阶段挑战）
# 所属部分：四、列表与循环；题型：阶段挑战（考场短题干算法拆解）。
# 参考：课程课件 `lec4`、`lec6-compound-data-types.pdf`（`for-else`、引用拷贝、序列扫描），
# 结合《Python语言程序设计基础（第3版）》第 6 章与《python基础教程（第三版）》第 2/5 章，
# 对标《往年题/python题库》高频算法小题《TwoSum》《最长连续递增子序列》《判断非连续子序列》，改编整合题。
#
# 先学（挑战题减少解法提示，只明确概念边界与读入坑点）：
# 1. 空行读入陷阱：当第 1、2 行可能是**空行**（代表空列表 `[]`）时，必须按行依次调用 `input().split()` 独立读取每一行，切勿直接用 `sys.stdin.read().split()`，否则空行会消失并导致第 3 行数据错位。
# 2. 算法边界概念区分：
#    - **两数之和**：要求两个**不同下标**（`i < j`），同一元素不能和自己相加；注意同一个数值如果在列表中出现两次（不同下标），是可以配对的。
#    - **严格连续递增子序列**：在原列表中下标必须连续，且后一项严格大于前一项（`a[k] > a[k - 1]`），**相等不算递增**；非空列表至少有长度为 `1` 的片段，空列表长度为 `0`。
#    - **保序非连续子序列**：从主序列中按从左到右先后顺序挑选元素（允许中间跳过若干项，但**不可打乱相对顺序**、每个位置最多匹配一次）构成目标片段。约定空序列是任何序列的子序列。
# 3. `for / else` 适合做双层查找无解兜底；所有中间过程不得修改原始主序列 `nums`。
#
# 输入（严格 3 行，勿打印输入提示）：
# 第 1 行：整数序列 `nums`（`0～50` 个空格分隔整数，**可能为空行**，可能含负数、重复值与 `0`）。
# 第 2 行：整数序列 `pattern`（`0～50` 个空格分隔整数，**可能为空行**）。
# 第 3 行：单个目标整数 `target`。
#
# 输出与约束（不得使用集合 `set`、`itertools` 或 `bisect`；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行（两数之和索引对）：在 `nums` 中寻找满足 `nums[i] + nums[j] == target` 且 `i < j` 的下标对：
#    若有解，输出字典序最小的一组（即 `i` 最小；`i` 相同时 `j` 最小），格式为 `i j`；若无解（含元素不足 2 个），输出 `-1`。
# 2. 第 2 行（最长严格连续递增子序列）：求 `nums` 中最长的严格连续递增片段，输出 `<最大长度> <起始下标>`；
#    若存在多段并列最长，取最早出现那一段的起始下标；若 `nums` 为空，输出 `0 -1`。
# 3. 第 3 行（非连续子序列判定）：判断 `pattern` 是否是 `nums` 的保序子序列，是则输出 `YES`，否则输出 `NO`。
# 4. 第 4 行（原序列完整性校验）：在不破坏原 `nums` 顺序的前提下，输出把 `nums` 首尾翻转后最前面的至多 `3` 个元素（空格分隔；若不足 3 个则全部输出；若 `nums` 为空输出 `EMPTY`）。
#
# 样例输入：
# 3 2 4 3 5 7 1
# 2 4 7
# 6
#
# 样例输出：
# 0 3
# 3 3
# YES
# 1 7 5
# 说明：nums[0]+nums[3]=3+3=6 比 (1,2) 更靠前故输出 0 3；最长严格连续递增为 [3,5,7] 长3起自下标3；2-4-7在nums中按序出现故YES；nums反转前3项为 1 7 5。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 第 1 步查找 `(i, j)` 时，为什么说用 `for i ...: for j ...:` 从小到大枚举配合 `break` / `for-else` 最容易自然保证输出“字典序最小的解”？
# 2. 在第 2 步计算连续递增长度时，若遇到 `nums[k] == nums[k - 1]`（相邻相等），应该怎样重置计数与临时起点？
#
# 评测：12 组测试集中在 评测/题库/33.json（重点自测全空/单空行、单元素、重复配对、全相等/全递减、并列最长起点与不足3项翻转）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第33题”。
#
# 请在下面写你的代码：

nums = [int(x) for x in input().split()]
pattern = [int(x) for x in input().split()]
target = int(input())

pairs = []
l = len(nums)
for i in range(l) :
    for j in range(i+1, l) :
        if nums[i] + nums[j] == target :
            pairs.append([i, j])
if l < 2 or not pairs :
    print("-1")
else :
    print(*pairs[0])

if not nums :
    print("0 -1")
else :
    mx_len = 1
    start, length = 0, 1
    for i in range(l) :
        cur = 1
        for j in range(i + 1, l) :
            if nums[j] >nums[j - 1] :
                cur += 1
            else :
                break
        if cur > mx_len :
            mx_len = cur
            start, length = i, cur
    print(mx_len, start)

i, j = 0, 0
while i < len(nums) and j < len(pattern):
    if nums[i] == pattern[j] :
        j += 1
    i += 1
print("YES" if j == len(pattern) else "NO")

if not nums :
    print("EMPTY")
else :
    nums.reverse()
    rev = []
    for i in range(min(3, len(nums))) :
        rev.append(nums[i])
    print(*rev)

# 思考1：外层 i 从小到大、内层 j 从 i + 1 到 n - 1 从小到大枚举，第一次满足 nums[i] + nums[j] == target 时必然就是“i 最小、相同 i 下 j 也最小”的字典序最小解；配合找到即 break 跳出（外层用标志或 for/else 打印 -1），既不用建 pairs 存全部分数对，又能天然保证字典序最小且无解时兜底。
# 思考2：严格连续递增要求后项严格大于前项（>），遇到 nums[k] <= nums[k - 1]（包括相邻相等 ==）即算断掉；在一次遍历写法中必须将当前连续长度重置为 1、临时起点更新为当前下标 k（cur_len = 1, cur_start = k），从 k 重新起算新的一段（若采用两层循环枚举起点 i，则是遇到 <= 直接 break 停止本段延伸）。