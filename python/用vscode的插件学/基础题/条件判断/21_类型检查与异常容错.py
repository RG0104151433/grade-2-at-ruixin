# 第 21 题：类型检查与异常容错（第三部分基础题 3）
# 所属部分：三、输入、类型转换与条件判断；题型：基础训练。
# 参考：课程课件 `lec3-basic-data-types.pdf`（type()、isinstance()）与 `lec4-control-structures.pdf`
# （try / except ValueError 异常容错），结合《Python编程快速上手》3.8 异常处理，自编题。
#
# 新知识：
# 1. type() 与 isinstance()：
#    - type(x) 返回 x 的具体类型；isinstance(x, int) 判断 x 是否为 int（返回 True/False），
#      也可以传元组同时判断多种类型：isinstance(x, (int, float))。
# 2. try / except ValueError 基础容错：
#    - int("abc") 或 float("3.a") 会抛出 ValueError 让程序崩溃；用 try/except 捕获后可继续安全执行：
#      try:
#          val = int(text)
#      except ValueError:
#          val = None
#    - 不要写裸 `except:`（会吞掉其他意外错误），应明确写出要捕获的 `ValueError`。
# 3. None 判断：当变量可能为 None 时，规范用身份运算符 `val is None` 或 `val is not None`。
#
# 输入（共两行，仅处理一组，勿打印输入提示）：
# 第 1 行：字符串 int_text（长度 1～30，可能带首尾空白，可能是合法整数或小数/文字）
# 第 2 行：字符串 num_text（长度 1～30，可能带首尾空白，可能是合法数字或文字）
#
# 输出与约束（不使用循环、列表、自定义函数，严禁使用 eval()；按 exact 严格匹配，限时 2 秒）：
# 第 1 行：将 int_text.strip() 尝试转为 int；成功输出 `INT:<整数>`，触发 ValueError 则输出 `NOT_INT`。
# 第 2 行：将 num_text.strip() 尝试转为 float；成功则用 isinstance(..., float) 确认后输出
#          `FLOAT:<保留2位小数>`，触发 ValueError 则输出 `NOT_NUM`。
# 第 3 行：若前两项均转换成功（用 is not None 判断），输出两数之和（保留 2 位小数）；否则输出 `CANNOT_ADD`。
#
# 样例输入：
#   -42  
#   3.5
#
# 样例输出：
# INT:-42
# FLOAT:3.50
# -38.50
# 说明：-42 转整数成功，3.5 转浮点成功，相加得 -38.50；若第 1 行是 "3.14" 则 int("3.14") 触发 ValueError。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 为什么课件强调优先写 `except ValueError:`，而不推荐写裸 `except:`？
# 2. 为什么工程和评测题推荐使用 int()/float() 配合 try/except，而不是直接写 eval(input())？
#
# 评测：10 组测试集中在 评测/题库/21.json（注意 "3.14" 不能直接 int()、"0"、负数与空/全文字边界）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第21题”。
#
# 请在下面写你的代码：

Int_text = input().strip()
Num_text = input().strip()
int_convert = False
num_convert = False
try :
    int_text = int(Int_text)
    int_convert = True
    print(f"INT:{int_text}")
except ValueError :
    print("NOT_INT")
try :
    num_text = float(Num_text)
    if isinstance(num_text, float) :
        num_convert = True
        print(f"FLOAT:{num_text:.2f}")
except ValueError :
    print("NOT_NUM")
if int_convert and num_convert :
    if int_text is not None and num_text is not None :
        print(f"{int_text + num_text:.2f}")
else :
    print("CANNOT_ADD")
# 裸except会吞掉其他报错（但是我不清楚吞掉其他报错又意味着什么）
# 直接用eval过于空泛，无法精细处理变量的具体情况