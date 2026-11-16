# 第 2 题：让变量保存消息
# 参考：仓库电子书《Python编程：从入门到实践（第2版）》第 2 章，2.2 变量。
# 本题根据该节知识点编写。
#
# 新知识：
# 变量名可以用来指代一个值。用 = 给变量赋值，例如：
# animal = "cat"
# 之后用 print(animal) 就能输出它的值；变量名不加引号。
# 再次给同一个变量赋值，就会更新它所指代的值。
#
# 任务（按顺序完成）：
# 1. 创建变量 message，让它保存文字 Hello, Python!
# 2. 用 print() 输出 message 的值。
# 3. 将同一个变量 message 的值改为 I am learning Python.
# 4. 再次用 print() 输出 message 的值。
#
# 预期输出（恰好两行，大小写、空格和标点一致）：
# Hello, Python!
# I am learning Python.
#
# 检查标准：输出正确，且两次输出都使用变量 message。
# 本题不需要 input()；不要直接把两句话分别写进 print()。
# 做完按 Ctrl+S 保存，然后告诉我“检查第2题”。我会运行检查，先给提示。
#
# 请在下面写你的代码：

str1="Hello, Python!"
str2="I am learning Python."
print(str1)
print(str2)
message="Hello, Python!"
print(message)
message="I am learning Python."
print(message)