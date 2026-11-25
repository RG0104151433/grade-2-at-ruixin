# 第 28 题：for循环与素数级数（第四部分基础题 1）
# 所属部分：四、列表与循环；题型：基础训练（含模板填空）。
# 参考：课程课件 `lec4-control-structures.pdf`（`for`、`range()`、`break` 仅跳最内层、`for-else` 素数、$\pi$ 级数），
# 结合《Python编程：从入门到实践（第2版）》第 4 章与《python基础教程（第三版）》5.5.2/5.5.5/5.5.6，
# 对标《往年题/慕课题库》第 4 周《素数判断》与《100以内素数之和》，改编题。
#
# 先学：
# 1. `for` 与 `range(start, stop, step)`：
#    - 区间左闭右开 `[start, stop)`；`step` 可为负数实现倒序（如 `range(10, 0, -2)` 依次产生 `10, 8, 6, 4, 2`）。
#    - **注意**：`range()` 参数只能是整数，传入浮点数会报 `TypeError`。
# 2. `break` 与 `continue`：`break` 只跳出**当前最内层**循环；`continue` 跳过本轮剩余语句进入下一轮。
# 3. `for / else` 结构（课件重点）：当 `for` 完整遍历结束、**中途未触发 `break`** 时执行 `else:`（若中途 `break` 则跳过 `else:`），常用于判断“无因数/未找到”。
#
# 输入（两行，勿打印输入提示）：
# 第 1 行：三个空格分隔整数 `a b step`（`1 <= a <= b <= 1000`，`1 <= step <= 20`）
# 第 2 行：一个正整数 `k_terms`（`1 <= k_terms <= 20000`）
#
# 输出与约束（不使用列表、自定义函数仅填模板中的 `is_prime`、不使用 while 循环；按 exact 严格匹配，限时 2 秒）：
# 1. 补全下方 `is_prime(n)` 函数（须用 `for / else` 判断 `n` 是否为素数，返回 `True` 或 `False`；注意 `n < 2` 非素数、`2` 是最小素数）。
# 2. 主程序逻辑（在调用区下方完成）：
#    - 第 1 行：按倒序 `range(b, a - 1, -step)` 检查区间内满足 `is_prime(x)` 的素数，按遍历顺序列出，单空格分隔（**末尾不得有多余空格**）；若一个都没有，输出 `NONE`。
#    - 第 2 行：上述选出素数的总和（若第 1 行为 `NONE` 则输出 `0`）。
#    - 第 3 行：用 `for` 计算莱布尼茨级数前 `k_terms` 项估算 $\pi$（$4 \times \sum_{k=0}^{k\_terms-1} \frac{(-1)^k}{2k+1}$），保留 `6` 位小数。
#
# 样例输入：
# 2 15 3
# 100
#
# 样例输出：
# 3
# 3
# 3.131593
# 说明：range(15, 1, -3) 依次检查 15, 12, 9, 6, 3，其中仅 3 为素数（和为 3）；前 100 项级数约 3.131593。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 在两层嵌套 `for` 循环中，内层执行 `break` 会直接跳出外层循环吗？`for / else` 的 `else` 为什么只能执行于“整轮未 `break`”？
# 2. 为什么 `range(0, 10, 0.5)` 会报错？如果像定积分那样把 `[a, b]` 分成 `n` 个浮点宽小段，应怎样用 `range` 配合下标计算？
#
# 评测：10 组测试集中在 评测/题库/28.json（重点自测无素数 NONE、a==b==2、step==1 与 k_terms==1）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第28题”。
#
# -------- 请仅补全下方函数体，并在下方作答区继续完成主程序 --------
def is_prime(n):
    # 请在下面写你的代码（用 for / else 判断并返回 True 或 False）：
    if n < 2 :
        return False
    m = int(pow(n, 0.5)) + 1
    for i in range(2, m) :
        if n % i == 0 :
            return False
    return True

# 请在下面继续写主程序（读取输入并输出第 1～3 行）：

A, B, Step = input().split()
a, b, step = int(A), int(B), int(Step)
prime = []
for i in range(b, a - 1, -step) :
    if is_prime(i) :
        prime.append(i)
if len(prime) == 0 :
    print("NONE\n0")
else :
    print(*prime)
    print(sum(prime))
p = 0.0
k = int(input())
for i in range(0, k) :
    p += (-1) ** i / (2 * i + 1)
p *= 4
print(f"{p:.6f}")

# 思考1：不会。break 只跳出当前最内层循环；for/else 的原理就是“循环体把所有元素完整跑完且一次也没触发 break 时才执行 else”，一旦中途 break 就会连同 else 一起跳过。
# 思考2：range() 只接收整数，传浮点数会报 TypeError；定积分应先算步长 dx = (b - a) / n，再用 for i in range(n): 遍历整数段号，由 x = a + i * dx 计算小段坐标。
#
# 不用 list 的对照写法片段（对应第 57～65 行，用字符串与累加器替代列表）：
# primes_str = ""
# prime_sum = 0
# for i in range(b, a - 1, -step):
#     if is_prime(i):
#         primes_str = str(i) if not primes_str else f"{primes_str} {i}"
#         prime_sum += i
# print(primes_str if primes_str else "NONE")
# print(prime_sum)