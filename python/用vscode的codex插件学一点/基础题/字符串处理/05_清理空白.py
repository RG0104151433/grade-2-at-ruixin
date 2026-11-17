# 第 5 题：清理姓名首尾的空格
# 参考：《Python编程：从入门到实践（第2版）》2.3.4 删除空白。
# 本题根据该节知识点编写。
#
# 新知识：字符串的 .strip() 方法
# .strip() 返回去掉首尾空白后的新字符串，中间的空格会保留。
# 例如："  red apple  ".strip() 的结果是 "red apple"。
# 调用它不会自动改变原变量，要用赋值保存返回的结果。
# 写法示例：cleaned_fruit = fruit.strip()
# 这里的 .strip() 是跟在字符串后面使用的方法，别漏掉括号。
#
# 任务：
# 1. 创建变量 name，值为 "  Eason Gu  "。
#    注意：姓名两端各有两个空格，Eason 和 Gu 之间有一个空格。
# 2. 使用 .strip() 处理 name，把结果保存到新变量 cleaned_name。
# 3. 使用 f 字符串，分别输出原姓名和清理后的姓名，格式如下。
#    两行中的姓名都应来自对应的变量。
#
# 预期输出：
# Original: [  Eason Gu  ]
# Cleaned: [Eason Gu]
#
# 方括号是输出内容，用来帮助你看清姓名两端有没有空格。
# 检查重点：用 .strip() 清理首尾空白、保存返回值、保留姓名中间的空格。
# 可以用两次 print()，也可以用一次 print() 配合 \n。
# 本题不需要 input()。
#
# 做完按 Ctrl+S 保存，再告诉我“检查第5题”。
#
# 请在下面写你的代码：

name = "  Eason Gao  "
cleaned_name = name.strip()
print(f"{name}\n{cleaned_name}")