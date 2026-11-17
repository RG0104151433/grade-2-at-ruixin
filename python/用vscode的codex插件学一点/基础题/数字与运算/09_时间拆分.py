# 第 9 题：把秒数拆成时、分、秒
# 所属部分：二、数字与运算；题型：基础应用。
# 参考：《“笨办法”学 Python 3》习题 3“数字和数学计算”中的除法与取余练习。
# 本题为自编应用题，另补充整除运算。
#
# 新知识：三种相关运算
# / 是普通除法，例如 17 / 5 得到 3.4；整数相除也会得到浮点数。
# // 是整除，例如 17 // 5 得到 3。本题只处理非负整数。
# % 是取余，例如 17 % 5 得到 2。
# 三者的除数都不能是 0。
#
# 情境：
# 一段活动持续了 total_seconds 秒，需要显示成“几小时、几分钟、几秒”，
# 同时显示这段活动总共相当于多少分钟（保留计算本身的小数结果）。
#
# 初始数据：total_seconds = 3672
# 单位关系：1 小时 = 60 分钟 = 3600 秒；1 分钟 = 60 秒。
#
# 任务：
# - 计算完整的小时数，保存到 hours。
# - 计算扣除完整小时后，还剩几整分钟，保存到 minutes。
# - 计算最后不足一分钟的秒数，保存到 seconds。
# - 计算总秒数相当于多少分钟，保存到 total_minutes（不是前面的 minutes）。
# - 用变量输出以上四个结果；输出标签可以自行调整。
#
# 建议输出：
# Hours: 1
# Minutes: 1
# Seconds: 12
# Total minutes: 61.2
#
# 检查重点：
# - 小时、分钟和秒的拆分使用整除与取余；总分钟数使用普通除法。
# - minutes 和 seconds 都应在 0～59 之间。
# - 四个结果都要由 total_seconds 计算得到并保存，不要写死样例答案。
# - 不修改 total_seconds，不需要 input()、条件判断、循环或小数格式化。
# - 我会替换总秒数，检查 0、不足一分钟、整分钟、整小时等情况。
#
# 可以先想想：取走一整小时后，应该用哪一部分秒数继续计算分钟？
# 保存后说“检查第9题”。
#
# 请在下面写你的代码：

total_seconds = 3672
total_minutes = total_seconds / 60
hours = total_seconds // 3600
total_seconds %= 3600
minutes = total_seconds // 60
total_seconds %= 60
seconds = total_seconds
print(f"Hours: {hours}\nMinutes: {minutes}\nSeconds: {seconds}\nTotal minutes: {total_minutes}")