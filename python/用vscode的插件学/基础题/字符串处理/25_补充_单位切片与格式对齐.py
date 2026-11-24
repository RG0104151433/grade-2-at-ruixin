# 第 25 题：单位切片与格式对齐（一～三部分考场真题补充 1）
# 所属部分：一～三补充巩固（字符串切片初探 + 格式控制）；题型：基础真题训练。
# 参考：《往年题/23级 python语言程序设计（全英文）  pretest.pdf》第 3 题 Currency Conversion II、
# 《往年题/慕课题库 练习+测试(1).docx》第 3 周《平方根格式化》与《三次方格式化》，改编题。
#
# 先学（补齐考场高频两点）：
# 1. 首尾索引与前缀/后缀切片（处理紧贴单位的输入）：
#    - `s[-1]` 取最后 1 个字符，`s[-3:]` 取最后 3 个字符，`s[:-3]` 取“除最后 3 个字符外”的前半部分；
#      同理，`s[-4:]` 与 `s[:-4]` 拆分 4 字母后缀（如 `"123Euro"` 中 `s[-4:] == "Euro"`、`s[:-4] == "123"`）。
# 2. 复数开方与带填充对齐格式化：
#    - 求 `a` 的平方根时，若用 `math.sqrt(a)` 遇到负数会报 `ValueError`；改用 `pow(a, 0.5)`，负数会自动得到 `complex`。
#    - 格式化规格 `{:+>30.3f}` 表示：宽度 30、右对齐、空白填 `+`、保留 3 位小数（复数会同时把实部和虚部保留 3 位小数）。
#    - 嵌套槽动态格式（.format() 与 f-string 通用）：
#      * `"{:{ch}^{w}}".format(val, ch=fill, w=width)` 与 `f"{val:{ch}^{w}}"` 都可用变量控制填充字符与宽度；
#      * 常见疑问：`f"{pow(num, 0.5):{ch}>30.3f}"` 把 `+` 换成 `{ch}` 在语法上**完全可行**（Python 会先取变量 `ch` 的单字符作填充符），但绝不能省掉内层花括号写成 `:ch>30.3f`（会把 `'c'`, `'h'` 当格式符报 `ValueError`）；且 `ch` 必须是单字符（2 个及以上字符报 `ValueError`）。在本题第 2 行按题意需固定用 `+`。
#
# 输入（两行，勿打印输入提示）：
# 第 1 行：带单位金额字符串 `money`（不含空白，如 `123RMB`、`999EUR`、`10Euro`、`10CNY`）
# 第 2 行：一个整数 `a`（`-10000 <= a <= 10000`）及填充宽度参数 `ch width`（如 `* 20`，用空格分隔三个值）
#
# 输出与约束（不使用循环、列表或自定义函数，不用 eval()；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行（汇率 `1 Euro = 7.8942 RMB`，仅接受精确后缀且数值部分可转为 >= 0 的 float，区分大小写）：
#    - `RMB` 转为 `Euro`（`/ 7.8942`），`Euro` 转为 `RMB`（`* 7.8942`）；
#    - `CNY` 转为 `EUR`（`/ 7.8942`），`EUR` 转为 `CNY`（`* 7.8942`）；
#    - 保留 2 位小数并紧跟对应输出单位，不加空格；若格式或数值非法，输出 `format error`。
# 2. 第 2 行：输出 `pow(a, 0.5)`，格式为宽度 30、右对齐、`+` 填充、保留 3 位小数。
# 3. 第 3 行：计算 `a ** 3` 的十进制字符串，按第 2 行输入的字符 `ch` 居中填充至宽度 `width`（超出宽度按原样输出）。
#
# 样例输入：
# 123RMB
# -4 * 12
#
# 样例输出：
# 15.58Euro
# ++++++++++++++++++0.000+2.000j
# ****-64*****
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 为什么在判断 `money` 后缀时，不能统一只用 `money[-3:]` 和 `money[:-3]`？
# 2. 为什么负数开方用 `pow(a, 0.5)` 能输出实部和虚部，而 `math.sqrt(a)` 会直接报错？
#
# 评测：10 组测试集中在 评测/题库/25.json。保存后按 Ctrl+Shift+B 评测，或说“检查第25题”。
#
# 请在下面写你的代码：

money = input().strip()
Num, ch, Width = input().split()
num = int(Num)
width = int(Width)

error = False
if money.endswith("Euro") :
    try :
        amount = float(money[:-4]) * 7.8942
        unit = "RMB"
        if amount < 0 :
            print("format error")
            error = True
    except ValueError :
        print("format error")
        error = True
elif money.endswith("RMB") :
    try :
        amount = float(money[:-3]) / 7.8942
        unit = "Euro"
        if amount < 0 :
            print("format error")
            error = True
    except ValueError :
        print("format error")
        error = True
elif money.endswith("EUR") :
    try :
        amount = float(money[:-3]) * 7.8942
        unit = "CNY"
        if amount < 0 :
            print("format error")
            error = True
    except ValueError :
        print("format error")
        error = True
elif money.endswith("CNY") :
    try :
        amount = float(money[:-3]) / 7.8942
        unit = "EUR"
        if amount < 0 :
            print("format error")
            error = True
    except ValueError :
        print("format error")
        error = True
else :
    print("format error")
    error = True
if not error :
    print(f"{amount:.2f}{unit}")

print(f"{pow(num, 0.5):+>30.3f}") # 将+的位置改成{ch}可以吗？
print("{:{c}^{w}}".format(num ** 3, c=ch, w=width))
# 思考1：4种货币后缀长度不统一（"Euro"为4个字符，而"RMB"/"CNY"/"EUR"为3个字符），若统一只用[-3:]和[:-3]会把"10Euro"误切成"10E"和"uro"，导致数值转换报错。
# 思考2：math.sqrt() 仅支持实数域，传入负数会直接抛出 ValueError；而 pow(a, 0.5) 支持复数运算会自动返回 complex，配合 :.3f 可同时保留实部与虚部各 3 位小数。