# 第 35 题：字符判定与映射替换（第五部分基础题 2）
# 所属部分：五、字符串与序列处理；题型：基础训练。
# 参考：课程课件 `lec3`、`lec6`，结合《Python语言程序设计基础（第3版）》（嵩天等）第 3 章与《python基础教程（第三版）》3.4 节，
# 对标《往年题/python.docx》5.5（maketrans/translate 与 string 常量）及《往年题/23级 pretest.pdf》第 12 题（字符分类统计），改编题。
#
# 先学（本节重点：看清前后缀元组、字符分类边界差异、string 常量与 maketrans 三参数用法）：
#
# 1. 前后缀判定 startswith / endswith（返回 bool）：
#    - s.startswith(prefix, start=0, end=len(s)) 与 s.endswith(suffix, start=0, end=len(s))：
#      * prefix / suffix 可以是**单个字符串**，也可以是**由多个字符串组成的元组**（如 s.endswith((".py", ".txt", ".md"))，匹配元组中任一项即返回 True；注意**不能传列表**，会报 TypeError）；
#      * 可选参数 start、end 指定只检查切片区间 s[start:end] 是否以指定前后缀开头或结尾（例如 line.startswith(('-', '+'), 1) 检查从下标 1 起是否以 '-' 或 '+' 开头）。
#
# 2. 字符分类方法全家桶（无参数；返回值全部是布尔值 bool：True 或 False！）：
#    - 调用方式：直接跟在字符串或单个字符后（如 if ch.isupper(): count += 1 或 if item.isdecimal(): ...）；
#    - 返回值含义：非空且“全部字符都满足该条件”返回 True，否则（含空串 ""）返回 False：
#      * s.isalpha() -> bool：非空且全为字母（含英文与汉字等 Unicode 字母），不含空格/数字/标点；
#      * s.isdigit() vs s.isdecimal() -> bool：
#        - s.isdecimal() 最严格：非空且只认十进制数字字符（'0'～'9' 等纯数字码）；
#        - s.isdigit() 范围稍宽：还会把上标数字（如 "²".isdigit() == True）也算作数字；
#        - ⚠️ 两者遇到负号 "-12"、小数点 "3.5" 或空格 " 5" 时均返回 False！
#      * s.isalnum() -> bool：非空且全为字母或数字；
#      * s.isspace() -> bool：非空且全为空白字符（空格、\t、\n、\r）；
#      * s.isupper() / s.islower() / s.istitle() -> bool：至少含 1 个区分大小写的字母且全部满足对应大小写规则（纯数字 "123" 调用它们均返回 False）。
#
# 3. string 模块常用常量与 str.maketrans + translate 批量映射：
#    - import string 后可直接使用常见标准常量：
#      * string.ascii_lowercase（"abcdefghijklmnopqrstuvwxyz"）
#      * string.ascii_uppercase（"ABCDEFGHIJKLMNOPQRSTUVWXYZ"）
#      * string.ascii_letters（大小写全 52 个字母）
#      * string.digits（"0123456789"）
#      * string.punctuation（全部常见英文标点符号，如 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~）
#    - 批量字符一对一替换与删除（str.maketrans + translate，只扫描一遍原串）：
#      * 第 1 步造“翻译词典”：table = str.maketrans(x, y, z)
#        - 本质原理：返回一个 Unicode 编码字典（如 str.maketrans("aeo", "123", ",!") -> {97: 49, 101: 50, 111: 51, 44: None, 33: None}），替换字符映射到目标编码，要删除的字符直接映射到 None。
#        - 三种传参方式：
#          ① 只替换不删除（2 参）：str.maketrans("aeo", "123") —— x 与 y 长度必须严格相等，不等长报 ValueError；
#          ② 只删除不替换（3 参前两参空串）：str.maketrans("", "", ",!?") —— 第 3 参 z 中出现的所有字符都会被删掉；
#          ③ 同时替换 + 批量删除（3 参全用）：str.maketrans("aeo", "123", ",!?") —— 若同一字符既在替换里又在删除里，第 3 参“删除”优先；第 3 参也可直接传 string.punctuation 一次性删光全部常见英文标点。
#      * 第 2 步应用词典：new_s = s.translate(table)
#        - 拿 table 对 s 从头到尾只扫描一遍（新字符就替换、None 就跳过删除、其余保留），返回新字符串且不改原串 s。
#        - 例如 s = "Hello, World! 2026"，经 table = str.maketrans("aeo", "123", ",!") 后得 "H2ll3 W3rld 2026"；且因为只扫一遍，像 'a'<->'b' 互换不会像两次 .replace() 那样把刚改好的字符又改回去。
#
# 输入（3 行，勿打印输入提示）：
# 第 1 行：一行非空混合文本 line（可含英文字母、数字、空格与标点符号，允许前后有空格，**请保留原样勿整行 strip**）。
# 第 2 行：若干由空白分隔的字符串项 items（至少 1 项，如代码文件名、数字串等）。
# 第 3 行：两个空格分隔、无重复字符且长度相等的字符串 src dst（长度均 >= 1）。
#
# 输出与约束（不得定义自定义函数；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行（逐字符分类统计，对标 pretest 第 12 题）：统计 line 中**大写英文字母、小写英文字母、十进制数字、空白字符、其他字符**的个数，5 个整数空格分隔输出。
# 2. 第 2 行（批量映射与标点清洗）：基于映射规则对 line 一次性做两步变换——将 src 中每个字符一对一替换成 dst 对应字符，同时**删掉全部 ASCII 标点符号**（空格与其他字符保留不变），直接输出处理结果。
# 3. 第 3 行（多后缀筛选与严格纯数字校验）：遍历第 2 行读入的 items：
#    - 统计不区分大小写以 .py、.txt 或 .md 结尾的项数记作 doc_cnt；
#    - 统计完全符合最严格十进制数字串判定（不含负号、小数点或上标符号）的项数记作 num_cnt，并按原顺序收集这些纯数字项；
#    输出 <doc_cnt> <num_cnt> | <用英文逗号 ',' 无空格拼接的纯数字项>（若没有纯数字项则竖线右侧输出 NONE）。
# 4. 第 4 行（指定起始位置的多前缀判断）：判断 line 从下标 1（含）起往后的部分是否以 src[0] 或 '-' 开头（若 line 长度不足 2 则判定为 False），输出 True 或 False。
#
# 样例输入：
# Hello, World! 2026
# a.py Note.MD 3.5 -7 008 readme.TXT
# aeo 123
#
# 样例输出：
# 2 8 4 2 2
# H2ll3 W3rld 2026
# 3 1 | 008
# False
# 说明：line 长18含2大写(H,W)、8小写、4数字(2026)、2空格、2标点(,与!)；映射a->1,e->2,o->3并删标点得 H2ll3 W3rld 2026；下标1开始为"ello..."不以'a'或'-'开头故False。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 为什么判断字符串是否为合法非负整数串时，isdecimal() 比 isdigit() 更严格，且两者面对 "-5" 和 "3.5" 都会返回什么？
# 2. 用 str.maketrans(x, y, z) 时，如果 x 与 y 的长度不一致会报什么错？为什么用 translate() 一次完成互换字符（如 'a'<->'b'）比连续调用两次 .replace() 更安全？
#
# 评测：10 组测试集中在 评测/题库/35.json（重点自测含互换映射、大小写混合后缀、上标字符²、负数小数过滤与短串下标1边界）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第35题”。
#
# 请在下面写你的代码：
import string

line = input()
items = input().split()
src, dst = input().split()

big, small, dec, space, other = 0, 0, 0, 0, 0
for ch in line :
    if ch.isupper() :
        big +=1
    elif ch.islower() :
        small += 1
    elif ch.isdecimal() :
        dec += 1
    elif ch.isspace() :
        space += 1
    else :
        other += 1
print(big, small, dec, space, other)

table = str.maketrans(src, dst, string.punctuation)
new_line = line.translate(table)
print(new_line)

doc_cnt, num_cnt = 0, 0
num = []
for item in items :
    if item.lower().endswith((".md", ".txt", ".py")) :
        doc_cnt += 1
    elif item.isdecimal() :
        num_cnt += 1
        num.append(item)
print(doc_cnt, num_cnt, "|", ",".join(num) if num_cnt else "NONE")

begin = False
if line.startswith((src[0], '-'), 1) :
    begin = True
print(begin)

# 思考1：isdecimal() 只认可真正的十进制数字字符（'0'~'9' 等，能安全传给 int()）；而 isdigit() 还会把上标数字如 '²'（如 "2²"）判定为 True，若直接 int("2²") 会报 ValueError，所以过滤纯非负整数串时 isdecimal() 更严格。两者遇到负号 "-5" 或小数点 "3.5" 时都会返回 False（只能识别无符号纯数字）。
# 思考2：如果 x 与 y 长度不一致，str.maketrans(x, y, z) 会直接抛出 ValueError。因为 translate() 只拿翻译表从头到尾一次性扫描原串、对每个原字符只查表替换一次，所以 'a'<->'b' 互换能一步到位；而连续两次 .replace() 会让第二步误把第一步刚改好的字符又改回来（例如 "ab".replace("a","b").replace("b","a") 会全变成 "aa"）。