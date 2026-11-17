# 第 7 题：整理学习名片（第一部分综合题）
# 参考：《Python编程：从入门到实践（第2版）》2.3.1 大小写处理、2.3.4 删除空白。
# 本题根据这些知识点自行编写，并结合前面练习的变量、f 字符串和多行输出。
#
# 新知识：字符串大小写转换
# .title()：将单词首字母变成大写，其余字母变成小写。
#   例如："sUNNY dAY".title() 的结果是 "Sunny Day"。
# .lower()：将字母转换成小写，例如 "ApPlE".lower() 得到 "apple"。
# .upper()：将字母转换成大写，例如 "ApPlE".upper() 得到 "APPLE"。
# 和 .strip() 一样，它们返回新字符串，不会自动改变原变量。
# 可以分步保存处理结果，也可以连续调用方法：先执行左边的方法，再处理其结果。
#
# 情境：
# 一张学习名片要把同一份原始资料展示成不同的格式。
# 原始资料大小写混乱，两端还有空格；同时需要保留原资料供核对。
#
# 初始数据（请自己写成两行赋值语句）：
# raw_name 的值为 "  eAsOn gAo  "。
# raw_language 的值为 "  PyThOn  "。
# 两个值的首尾各有两个空格，姓名中间有一个空格。
#
# 任务：
# 1. 把清理首尾空白并调整为单词首字母大写的姓名保存到 display_name。
# 2. 把清理首尾空白并转换为全小写的语言名称保存到 language_key。
# 3. 把徽章文字保存到 badge：姓名和语言均全大写，首尾无空格，
#    两者之间用 " - " 连接。姓名中间的空格仍要保留。
# 4. 使用 f 字符串输出下面的四行；至少有一次输出使用 \n。
# 5. 保持 raw_name 和 raw_language 的原始值不变，最后一行展示它们。
#
# 建议输出：
# Name: Eason Gao
# Language: python
# Badge: EASON GAO - PYTHON
# Original: [  eAsOn gAo  ] [  PyThOn  ]
#
# 检查重点：
# - 变量、空白清理、大小写转换、f 字符串、换行与原值保留的综合运用。
# - display_name、language_key、badge 必须由原始资料处理得到并保存。
# - 姓名与语言的文字只在初始数据中填写，不能在后面直接写死处理结果。
# - 我会换一组原始资料检查，确认程序能自动生成相应结果。
# - 输出标签可自行调整；内容、大小写、首尾空格处理与四行结构需要正确。
#
# 思考顺序：先确定每种展示需要什么处理，再决定如何保存结果、组织输出。
# 不需要 input()、循环、条件判断或其他未学语法。
# 做完按 Ctrl+S 保存，再告诉我“检查第7题”。
#
# 请在下面写你的代码：

raw_name = "  eAsOn gAo  "
raw_language = "  PyThOn  "
op_name = raw_name.strip()
op_language = raw_language.strip()
display_name = op_name.title()
display_language = op_language.lower()
badge = display_name.upper() + " - " + display_language.upper()
print(f"Name: {display_name}\nLanguage: {display_language.lower()}\nBadge: {badge}\nOriginal: [{raw_name}] [{raw_language}]")