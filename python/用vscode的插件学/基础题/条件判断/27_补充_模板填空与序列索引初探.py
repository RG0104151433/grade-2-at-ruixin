# 第 27 题：模板填空与序列索引初探（一～三部分考场真题补充 3）
# 所属部分：一～三补充巩固（代码模板填空初体验 + 索引越界 + 鲁棒数字判别）；题型：基础真题训练。
# 参考：《往年题/2026春py期中考试题目.docx》第 5 题《数的各位数字求和》与第 6 题《棋子回位》、
# 《往年题/python题库.docx》第 9/25 题《判断字符是否相等》、
# 《往年题/慕课题库 练习+测试(1).docx》第 8 周《数字的鲁棒输入》，改编题。
#
# 先学（适应考场“给定函数模板填空”与数字/字符细节）：
# 1. 考场编程模板填空：题干事先写好了函数名 `def digit_sum(x):` 和末尾调用代码；你只需补全函数体里的缩进代码，用 `return 结果` 交回答案，不要修改函数外的调用框架。
# 2. 索引越界前置检查：访问第 `k` 个字符（1 起算，即下标 `k - 1`）或末字符 `s[-1]` 前，若 `s` 为空或 `not (1 <= k <= len(s))` 必须提前拦截，否则报 `IndexError`。
# 3. 不依赖 `eval()` 的数字鲁棒判别：按 `int(t)` → `float(t)` → `complex(t)` 顺序依次尝试转换；三者均 `ValueError` 则不是合法纯数字（会自动拒绝 `"10**2"`、`"abc"` 等）。
#
# 输入（四行，勿打印输入提示）：
# 第 1 行：整数 `x`（`0 <= x < 1000`）
# 第 2 行：`s,k`（逗号分隔：左侧为字符串 `s`（不含逗号，可能为空串），右侧为整数位置 `k`）
# 第 3 行：棋子移动字符串 `moves`（由 `'E'`/`'S'`/`'W'`/`'N'` 组成）
# 第 4 行：待校验字符串 `num_s`
#
# 输出与约束（不使用循环、列表，不用 eval()；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行：补全下方 `digit_sum(x)` 函数，由框架调用并输出 `x` 各位数字之和（十进制 `个+十+百`）。
# 2. 第 2 行：若 `s` 为空或 `k < 1` 或 `k > len(s)` 输出 `ERROR`；否则判断 `s` 第 `k` 个字符与末字符是否相等，输出 `True` 或 `False`。
# 3. 第 3 行：借助 `.count()` 判断执行 `moves` 后（E 与 W 抵消，S 与 N 抵消）是否回到原点，输出 `YES` 或 `NO`。
# 4. 第 4 行：若 `num_s.strip()` 为合法纯十进制整数/浮点数/复数，输出其平方（若为整数保留整数形式，否则直接输出平方值）；否则输出 `输入有误`。
#
# 样例输入：
# 932
# hello,2
# ENWSENWS
# 10**2
#
# 样例输出：
# 14
# False
# YES
# 输入有误
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 第 4 行如果用 `eval(num_s)` 处理 `"10**2"` 会怎样？为什么按 `int -> float -> complex` 顺序尝试能准确拦截？
# 2. 第 2 行为什么要先判断 `1 <= k <= len(s)`，再比较 `s[k - 1] == s[-1]`？
#
# 评测：10 组测试集中在 评测/题库/27.json。保存后按 Ctrl+Shift+B 评测，或说“检查第27题”。
#
# -------- 请仅补全下方函数体，并在分割线下方继续完成第 2～4 行逻辑 --------
def digit_sum(x):
    # 请在下面写你的代码（返回 x 各位数字之和，勿在此打印）：
    n = x
    sum = 0
    while n > 0 :
        sum += n % 10
        n //= 10
    return sum

# -------- 以下调用框架请勿删改 --------
_x = int(input())
print(digit_sum(_x))

# 请在下面继续写第 2～4 行输入与输出逻辑：

S, K = input().split(",")
s = S.strip()
k = int(K)
error = False
if not s or k < 1 or k > len(s) :
    print("ERROR")
elif s[k-1] == s[-1] :
    print("True")
else :
    print("False")

moves = input().strip()
if moves.count("E") == moves.count("W") and moves.count("N") == moves.count("S") :
    print("YES")
else :
    print("NO")

Num = input().strip()
try :
    num = int(Num)
    print(f"{int(pow(num, 2))}")
except ValueError :
    try :
        num = float(Num)
        print(f"{pow(num, 2)}")
    except ValueError :
        try :
            num = complex(Num)
            print(f"{pow(num, 2)}")
        except ValueError :
            print("输入有误")

# 如果用 eval("10**2") 会直接把它当 Python 表达式算出 100（还会执行任意代码），无法识别“非纯数字”；按 int -> float -> complex 顺序只做字面数值解析，遇到 "10**2"、"0b10" 或文本都会触发 ValueError 从而准确拦截。
# 必须首先检验下标范围，不然会溢出