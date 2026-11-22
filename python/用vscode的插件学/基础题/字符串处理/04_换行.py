# 第 4 题：用一次 print() 输出三行
# 参考：《Python编程：从入门到实践（第2版）》2.3.3 使用制表符或换行符来添加空白。
# 本题只练习其中的换行符。
#
# 新知识：\n 表示换行
# 在字符串里面写 \n，输出到这里时就会换到下一行。
# 例如：print("apple\nbanana") 会输出两行，分别是 apple 和 banana。
# 注意：\ 是反斜杠，不是 /；\n 要写在引号里面。
# f 字符串里也可以使用 \n。
#
# 任务：
# 1. 创建变量 name，值为 "Eason"。
# 2. 创建变量 language，值为 "Python"。
# 3. 只调用一次 print()，结合 f 字符串和 \n，输出下面的三行文字。
#    前两行中的姓名和语言要来自对应的变量。
#
# 预期输出（行与行之间没有空行）：
# Name: Eason
# Language: Python
# Keep practicing!
#
# 检查重点：理解 \n 如何在字符串内部换行，并复习 f 字符串。
# 不需要 input()，也不需要循环。
# 做完按 Ctrl+S 保存，再告诉我“检查第4题”。
#
# 请在下面写你的代码：

name = "Eason"
language = "Python"
print(f"Name: {name}\nLanguage: {language}\nKeep practicing!")