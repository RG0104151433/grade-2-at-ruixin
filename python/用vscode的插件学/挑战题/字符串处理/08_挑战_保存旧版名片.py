# 第 8 题：保存旧版名片（第一部分挑战题）
# 参考：《“笨办法”学 Python 3》习题 4“变量和命名”的变量依赖与代码阅读训练，
# 结合《Python编程：从入门到实践（第2版）》第 2 章的变量和字符串知识。
# 这是自编挑战题，不是原书题目。
#
# 本题不增加新语法。
# 挑战重点：执行顺序、变量重新赋值、计算结果的保存，以及不同展示结果的管理。
#
# 情境：
# 你已经生成了一份学习名片。随后原始资料发生变化，需生成新版名片。
# 最后一次性展示旧版与新版，旧版必须仍然包含旧资料。
#
# 第一阶段：生成旧版
# 1. 创建 raw_name，值为 "  eAsOn gAo  "。
# 2. 创建 raw_language，值为 "  PyThOn  "。
# 3. 清理资料首尾的空白，将姓名调整为单词首字母大写，语言调整为小写。
# 4. 用这些计算结果生成一个三行字符串，保存到 saved_card：
#    第一行是姓名，第二行是语言，第三行是全大写的徽章。
#    徽章中的姓名与语言用 " - " 连接，参考下面的建议输出。
#
# 第二阶段：生成新版
# 5. 在旧版已保存之后，给同两个变量重新赋值：
#    raw_name 改为 "  aDA loVELACE  "。
#    raw_language 改为 "  jAvAsCrIpT  "。
# 6. 根据更新后的资料重新计算，生成同样结构的三行字符串，保存到 current_card。
#
# 第三阶段：最后统一输出
# 7. 在上述两个阶段都结束后，才输出 saved_card 和 current_card，
#    并分别添加 Saved: 和 Current: 两行标题。
# 8. 在代码末尾加一条 # 注释，解释：原变量改变后，saved_card 为什么仍是旧资料？
#
# 建议输出（共八行，无空行）：
# Saved:
# Name: Eason Gao
# Language: python
# Badge: EASON GAO - PYTHON
# Current:
# Name: Ada Lovelace
# Language: javascript
# Badge: ADA LOVELACE - JAVASCRIPT
#
# 约束与检查重点：
# - saved_card 和 current_card 都必须是由变量生成、包含 \n 的三行字符串。
# - saved_card 只赋值一次；生成新版时不得改写它。
# - 必须重新给 raw_name 和 raw_language 赋值，不能只另建一组原始资料变量。
# - 四个原始字符串只在对应阶段的初始赋值中出现，其他位置不许写死姓名或语言。
# - 用 .strip()、.title()、.lower()、.upper() 自动处理资料，不依赖固定字符位置。
# - 可以重新使用中间变量，也可以创建新的中间变量，自行决定执行顺序。
# - 原始资料只在两次指定赋值时改变；清理和大小写处理不要覆盖 raw_name、raw_language。
# - 输出标签可以自行调整，内容、版本对应关系、八行结构必须正确。
# - 我会替换两版的姓名和语言，检查不同长度资料与首尾空白的处理。
# - 不需要 input()、列表、循环、函数或条件判断。
#
# 先独立拆解步骤；遇到困难可以告诉我“给第8题一个提示”。
# 保存后说“检查第8题”。
#
# 请在下面写你的代码：

raw_name = "  eAsOn gAo  "
raw_language = "  PyThOn  "
cap_name = raw_name.strip().title()
cap_language = raw_language.strip().lower()
saved_card = "Name: " + cap_name + "\n" + "Language: " + cap_language + "\n" + "Badge: " + cap_name.upper() + " - " + cap_language.upper()
# print(f"Saced: \nName: {cap_name}\nLanguage: {cap_language}\nBadge: {saved_card}")
raw_name = "  aDA loVELACE  "
raw_language = "  jAvAsCrIpT  "
cap_name2 = raw_name.strip().title()
cap_language2 = raw_language.strip().lower()
current_card = "Name: " + cap_name2 + "\n" + "Language: " + cap_language2 + "\n" + "Badge: " + cap_name2.upper() + " - " + cap_language2.upper()
print(f"Saved: \n{saved_card}")
print(f"Current: \n{current_card}")
# print(f"Current: \nName: {cap_name2}\nLanguage: {cap_language2}\nBadge: {current_card}")
# 更新之后，实际上没有改变saved_card的生成，变量本身没有被改动，自然还是一样的