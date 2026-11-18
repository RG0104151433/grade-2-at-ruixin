# 第 14 题：字符编码与格式化卡片（第一部分补充综合题）
# 参考：课程课件 `lec2-basic-programming.pdf`（IPO 分析法、保留字与内置函数、转义）与
# `lec3-basic-data-types.pdf`（ord()、chr()、str.format() 对齐规格），自编综合题。
#
# 先学：
# 1. IPO 分析法：写代码前先拆清 Input（输入什么）→ Process（处理什么）→ Output（输出什么格式）。
# 2. Unicode 编码：
#    - ord(ch)：返回单个字符对应的 Unicode 整数编码，例如 ord('A') 是 65，ord('数') 是 25968。
#    - chr(code)：把整数编码还原为对应字符，例如 chr(68) 是 'D'。
# 3. 保留字 vs 内置函数：
#    - 保留字（如 if、else、for、in、def）不能作变量名，写了会报 SyntaxError；
#    - print、input、str、ord、chr、format 不是保留字，而是内置函数/类型名，
#      虽然语法上能被赋值覆盖，但一旦覆盖就会破坏原有功能，因此也不要拿它们当变量名。
# 4. str.format() 对齐规格：
#    - "{0:<6}".format(ch) 表示占用至少 6 格、左对齐；"{1:>6}".format(code) 表示占至少 6 格、右对齐。
# 5. 转义字符：双引号字符串里输出英文双引号要写 \"，制表符写 \t。
#
# 题目（按 IPO 自行拆解）：
# 读取一个字符 ch 和一个整数偏移量 offset，生成该字符的编码信息卡片。
# - 计算 ch 的 Unicode 编码 code，以及向后偏移 offset 位得到的新字符 shifted（即编码为 code + offset）。
# - 按下方格式输出 3 行：
#   第 1 行：Char: "<原字符>"<制表符>Code: <原编码>
#   第 2 行：Next: "<偏移后字符>"<制表符>Code: <偏移后编码>
#   第 3 行：使用 str.format() 对齐，输出 [<ch左对齐占6格>|<code右对齐占6格>]
#
# 输入格式：
# 第 1 行：一个可见非空白字符 ch（长度恰好为 1）。
# 第 2 行：整数 offset（1 <= offset <= 5）。
# 每次运行只处理这一组输入，读取时不要加输入提示文字。
#
# 输出格式：
# 严格输出 3 行；第一、二行引号为英文双引号 "，中间是单个制表符 \t（不是多个空格）。
# 评测按字符完全匹配（exact），每个测试点限时 2 秒。
#
# 样例输入：
# A
# 3
#
# 样例输出：
# Char: "A"	Code: 65
# Next: "D"	Code: 68
# [A     |    65]
#
# 代码末尾附加思考（请用 # 注释写两句话，检查时我会审阅）：
# 1. if 和 print 哪个是保留字、哪个是内置函数？
# 2. 如果不小心写了 ord = 10，后面再调用 ord('A') 会发生什么？
#
# 综合检查：IPO 拆解、变量避坑命名、ord()/chr()、\" 与 \t 转义、str.format() 左右对齐、注释作答。
# 不需要条件判断、循环、列表或自定义函数。
# 10 组测试集中在 评测/题库/14.json。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第14题”。
#
# 请在下面写你的代码：

ch1 = input()
offset = int(input())
ch2 = chr(ord(ch1) + offset)
ch = "{0:<6}".format(ch1)
order = "{0:>6}".format(ord(ch1))
print(f"Char: \"{ch1}\"\tCode: {ord(ch1)}\nNext: \"{ch2}\"\tCode: {ord(ch2)}\n[{ch}|{order}]")
# 对于你说的那个str.format格式，我希望你可以再说明白一点，解释清楚其具体规则
# if是保留字，print是函数名
# 复制ord = 10会覆盖默认的函数，再写函数就运行不了了