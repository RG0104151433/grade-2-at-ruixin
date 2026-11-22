# 第 3 题：生成一句欢迎语
# 参考：《Python编程：从入门到实践（第2版）》2.3.2 在字符串中使用变量。
# 本题根据该节知识点编写。
#
# 新知识：f 字符串
# 在字符串前加 f，就可以用 {变量名} 将变量的值插入文字中。
# 例如：
# animal = "cat"
# print(f"I like my {animal}.")
# 上面的输出是：I like my cat.
# 注意：f 放在引号外面，花括号放在引号里面。
#
# 任务：
# 1. 创建变量 name，值为 "Eason"。
# 2. 创建变量 language，值为 "Python"。
# 3. 使用 f 字符串，把这两个变量的值放入下面的欢迎语并输出。
#
# 预期输出：
# Hello, Eason! Welcome to Python.
#
# 检查重点：欢迎语中的名字和语言必须来自 name、language 两个变量。
# 你只修改变量的值时，输出的名字和语言也应随之变化。
# 本题不需要 input()，直接运行即可。
#
# 做完按 Ctrl+S 保存，再告诉我“检查第3题”。
#
# 请在下面写你的代码：

name="Eason"
language="Python"
print(f"Hello, {name}! Welcome to {language}.")