# 第 18 题：科学计数、复数与 math 几何（第二部分收官基础题）
# 所属部分：二、数字与运算；题型：基础应用。
# 参考：课程课件 `lec3-basic-data-types.pdf`（科学计数法 E 记法、复数 complex、跨类型拓宽、
# math 模块与 isnan），结合《Python编程：从入门到实践（第2版）》2.4 数字，自编题。
#
# 新知识：
# 1. math 模块常用能力：
#    - import math 后可用 math.sqrt(x)（平方根）、math.pi（标准圆周率）。
#    - math.nan 表示“非数字”（NaN），且 NaN 不等于任何值（math.nan == math.nan 为 False），
#      判断一个数是否为 NaN 必须用 math.isnan(x)。
# 2. 科学计数法（E 记法）：
#    - `<a>e<b>` 或 `<a>E<b>` 表示 a * 10^b，类型为 float；例如 4.3e-3 是 0.0043，9.6E5 是 960000.0。
#    - float("4.3e-3") 可直接将科学计数字符串转为浮点数；输出用 `{val:.2e}` 可按科学计数法保留 2 位小数。
# 3. 复数（complex）与跨数值类型拓宽规则：
#    - 用 complex(a, b) 或 a + bj 创建复数（虚部后缀是 j，不是 i）；z.real 取实部，z.imag 取虚部（均为 float）。
#    - 跨类型混合运算按“由窄到宽”自动转换：int -> float -> complex。
#      例如 int + float 得 float；complex + int（或 float）得 complex。
#
# 输入（一行 4 个空白分隔数值，仅处理一组，勿打印输入提示）：
# a    直角边 1，也为圆半径（整数或小数，0 < a <= 1000）
# b    直角边 2（整数或小数，0 < b <= 1000）
# sci  科学计数法表示的小数字符串（如 4.3e-3、1.25E4，0 < sci <= 1e6）
# k    放大倍数整数（1 <= k <= 100）
#
# 输出与约束（不使用 if、循环、列表或自定义函数；按 exact 严格匹配，限时 2 秒）：
# 第 1 行：直角三角形斜边长 math.sqrt(a**2 + b**2) 与半径为 a 的圆面积 math.pi * (a ** 2)，
#          各保留 2 位小数，单空格隔开。
# 第 2 行：float(sci) * k 的结果，依次输出普通小数（保留 4 位小数）与科学计数法形式（使用 :.2e），
#          两项单空格隔开。
# 第 3 行：构造复数 z = complex(a, b)，计算混合运算 res = z + k，输出 res.real 与 res.imag，
#          各保留 2 位小数，单空格隔开。
#
# 样例输入：
# 3 4 4.3e-3 10
#
# 样例输出：
# 5.00 28.27
# 0.0430 4.30e-02
# 13.00 4.00
# 说明：斜边 sqrt(3^2+4^2)=5.00，圆面积 pi*3^2≈28.27；0.0043*10=0.0430=4.30e-02；(3+4j)+10=13+4j。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 表达式 1 + 2.0 + (3 + 4j) 的结果是什么类型？遵循什么跨类型拓宽顺序？
# 2. math.nan == math.nan 的结果是 True 还是 False？判断是否为 NaN 应调用什么函数？
#
# 评测：10 组测试集中在 评测/题库/18.json。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第18题”。
#
# 请在下面写你的代码：

import math
A, B, Sci, K = input().split()
a = float(A)
b = float(B)
sci = float(Sci)
k = float(K)
z = complex(a, b)
res = z + k
print(f"{math.sqrt(a ** 2 + b ** 2):.2f} {math.pi * a ** 2:.2f}\n{sci * k:.4f} {sci * k:.2e}\n{res.real:.2f} {res.imag:.2f}")