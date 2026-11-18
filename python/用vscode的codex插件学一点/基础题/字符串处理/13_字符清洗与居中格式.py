# 第 13 题：字符清洗与居中格式（第一部分补充基础题）
# 参考：课程课件 `lec3-basic-data-types.pdf` 的字符串操作（strip 传参、center、format、len），
# 结合《Python编程：从入门到实践（第2版）》2.3.1 大小写处理与 2.3.4 删除空白，自编题。
#
# 新知识：
# 1. .strip(chars)：传入字符串时，会把参数看作“要剥离的字符集合”（不是按整体子串匹配），
#    从字符串首尾两端不断删去出现在集合中的任意字符，直到遇到不在集合中的字符为止；
#    字符串中间的字符不会被删掉，也不会改变原变量。
#    例如："= python= ".strip(" =np") 会去掉两端的空格、'=' 以及右侧的 'n'，得到 "pytho"。
# 2. .center(width, fillchar)：返回总宽度为 width 的居中字符串，不足部分左右用单字符 fillchar 填充；
#    当原字符串长度大于或等于 width 时，原样返回，不会截断。
# 3. str.format()："{0} -> {1}".format(a, b) 或 "{} -> {}".format(a, b) 按顺序填入槽位，
#    功能和 f 字符串类似，是课程课件中最常用的格式化写法。
# 4. 读取输入：直接使用 input() 读取整行字符串（不要在括号里写提示文字，也不要多删原始空白）；
#    第二行的宽度用 int(input()) 转成整数。
#
# 题目：
# 给定三行输入，依次为：原始标签 raw_tag、排版宽度 width（整数）、填充字符 fill_char（单个字符）。
# 请按以下要求清洗并排版输出：
# 1. 保留 raw_tag 原值不变。
# 2. 用 .strip(" =*#") 去掉 raw_tag 首尾的空格、'='、'*'、'#'，再转为全大写，保存为 cleaned。
# 3. 按顺序输出三行：
#    - 第 1 行：cleaned 的字符长度（整数）。
#    - 第 2 行：用 .center(width, fill_char) 将 cleaned 居中排版的结果。
#    - 第 3 行：使用 str.format() 输出 "<raw_tag> -> <cleaned>"（保留 raw_tag 原始首尾内容与大小写）。
#
# 输入格式：
# 第 1 行：字符串 raw_tag（长度 <= 60，清理后至少剩余 1 个有效字符）。
# 第 2 行：整数 width（1 <= width <= 80）。
# 第 3 行：单个非空格可见字符 fill_char（长度为 1，如 *、-、=、+）。
# 每次运行只处理这一组数据。
#
# 输出格式：
# 严格输出上述三行；不要输出额外标签、提示或调试信息。
# 评测按字符完全匹配（exact），空格与大小写必须完全一致。每个测试点限时 2 秒。
#
# 样例输入：
#   ==python basics**  
# 20
# *
#
# 样例输出：
# 13
# ***PYTHON BASICS****
#   ==python basics**   -> PYTHON BASICS
#
# 样例说明：raw_tag 首尾各有 2 个空格和装饰符号，清理并大写后为 "PYTHON BASICS"（长度 13）；
# 第三行箭头左侧必须保留 raw_tag 原来的前后空格与符号。
#
# 检查重点：真实 input() 与 int()、.strip(chars) 字符集合语义、.center()、.format()、原值保留。
# 不需要条件判断、循环、列表或函数。
# 10 组测试集中在 评测/题库/13.json。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第13题”。
#
# 请在下面写你的代码：

raw = input()
str = raw.strip(" *=#").upper()
width = int(input())
fillchar = input()
length = len(str)
result = str.center(width,fillchar)
form = "{} -> {}".format(raw,str)
print(f"{length}\n{result}\n{form}")