# 第 34 题：序列切片与查找替换（第五部分基础题 1）
# 所属部分：五、字符串与序列处理；题型：基础训练。
# 参考：课程课件 `lec3-basic-data-types.pdf`、`lec6-compound-data-types.pdf`（序列统一操作、步长与逆序切片、`index`、`count`、`replace`、`split`），
# 结合《Python语言程序设计基础（第3版）》（嵩天等）第 3/6 章与《python基础教程（第三版）》2.2/3.4 节，
# 对标《往年题/python.docx》5.1～5.2，改编自编题。
#
# 先学（本节重点：看清每个序列操作与字符串方法的参数、默认值、返回值与报错边界）：
#
# 1. 序列统一视角（str / tuple / list 共性）与三参数切片 seq[start:stop:step]：
#    - 通用下标：正索引 0 ～ len-1，负索引 -len ～ -1；越界报 IndexError。
#    - 不可变性：str 与 tuple 不可原地修改元素（如 s[0] = 'x' 会报 TypeError），所有字符串修改方法都会**返回新字符串**，原串保持不变。
#    - 完整切片 seq[start:stop:step]：
#      * step > 0（省略默认 1）：从左向右切，start 默认 0，stop 默认 len(seq)（左闭右开）；
#      * step < 0（如 -1、-2）：从右向左切，start 省略默认末尾，stop 省略默认越过索引 0（到达最左端前）；
#        例：text = "abracadabra"，text[::-2] 从末位开始每跳 2 步向左取，得到 "abdcra"；text[5:1:-1] 从下标 5（含）向左取到下标 1（不含），即取下标 5,4,3,2。
#      * 越界与方向不符（如正步长时 start >= stop，或负步长时 s[1:5:-1]）都不会报错，而是安全返回空序列；但 step == 0 会报 ValueError。
#    - 序列比较与 Unicode 编码极值：
#      * 计算机中每个字符都对应一个唯一整数编号，即 Unicode 码值（可通过 ord(字符) 查看，其中 ASCII 区间按数值从小到大排为：'0'~'9'(48~57) < 'A'~'Z'(65~90) < 'a'~'z'(97~122) < 汉字(上万)）；
#      * 字符串对比大小、以及取极值时，都是逐个比较字符的 ord() 数值；
#      * “编码最小/最大的单个字符”就是整串中 ord(ch) 数值最小/最大的那个字符本身：
#        例1："abracadabra" 含 'a'(97)、'b'(98)、'c'(99)、'd'(100)、'r'(114)，故编码最小字符是 'a'、最大字符是 'r'；
#        例2："ZzAa09" 中 '0'(48) < '9'(57) < 'A'(65) < 'Z'(90) < 'a'(97) < 'z'(122)，故最小是 '0'、最大是 'z'（注意小写字母编码比大写字母大）。
#
# 2. 查找、计数与替换方法（均不修改原串）：
#    - s.find(sub, start=0, end=len(s)) 与 s.rfind(sub, start=0, end=len(s))：
#      * 参数：sub 为待查子串，可选 start、end 限定只检查切片区间 [start, end)（与常规切片同样左闭右开）。
#      * 返回值：find 从左往右找、rfind 从右往左找，返回**首次匹配到的首字符下标**（注意返回的是相对于整个原串 s 的绝对下标）；**找不到返回 -1**（不会报错）。
#    - s.index(sub, start=0, end=len(s)) 与 s.rindex(...)：
#      * 参数和返回值与 find / rfind 完全相同，唯一区别是**找不到时直接报 ValueError**。
#    - s.count(sub, start=0, end=len(s))：
#      * 统计 sub 在 [start, end) 区间内**互不重叠**出现的次数（例："aaaa".count("aa") 为 2）。找不到返回 0。
#    - s.replace(old, new, count=-1)：
#      * 参数：old 为旧子串，new 为新子串，可选 count 默认 -1（全部替换）；若传入正整数（如 count=2），则只从左向右替换**前 count 次**匹配。
#      * 返回值：返回替换后的新字符串（找不到 old 时原样返回副本）。
#
# 3. 拆分方法 split / rsplit / splitlines：
#    - s.split(sep=None, maxsplit=-1)：
#      * 无参（sep=None）：把任意长度连续空白都当作分隔符，并自动去掉首尾空白、绝不产生空串；
#      * 指定字符（如 sep=":"）：每遇到 1 个 sep 就严格切 1 刀，连续 sep 或首尾 sep 会切出空串 ""（例：":a::b".split(":") -> ['', 'a', '', 'b']）；
#      * maxsplit：默认 -1 不限次数；若设为 1，则从左起只切 1 刀，最多返回 2 段（如 "a:b:c".split(":", 1) -> ['a', 'b:c']）。
#    - s.rsplit(sep=None, maxsplit=-1)：
#      * 与 split 唯一区别在于指定 maxsplit 时**从右向左**切（例："a:b:c".rsplit(":", 1) -> ['a:b', 'c']）。
#    - s.splitlines(keepends=False)：按行分隔符切分成行列表，默认不保留末尾换行符。
#
# 输入（4 行，勿打印输入提示）：
# 第 1 行：一个非空且不含空白的字符串 text（长度 >= 6）。
# 第 2 行：一个非空且不含空白的待查子串 sub。
# 第 3 行：两个空格分隔的不含空白字符串 old_s new_s。
# 第 4 行：一条带英文冒号 ':' 的配置串 log_line（至少包含 3 个英文冒号）。
#
# 输出与约束（不得定义自定义函数；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行（步长切片与极值）：依次输出 4 项（空格分隔）——
#    ① 从 text 末位起从右向左每隔 1 个取 1 个字符得到的序列；
#    ② 从下标 5（含）倒序切到下标 1（不含）得到的片段；
#    ③ text 中 Unicode 编码值（即 ord(字符)）最小的单个字符；
#    ④ text 中 Unicode 编码值（即 ord(字符)）最大的单个字符。
# 2. 第 2 行（查找与计数）：依次输出 4 个整数（空格分隔）——
#    ① sub 在整个 text 中从左首次出现的下标（找不到记 -1，不可报错）；
#    ② sub 在整个 text 中从右往左首次出现（即整串最靠右那次匹配）的下标（找不到记 -1）；
#    ③ sub 在 text 下标区间 [1, len(text) - 1) 内从左首次出现的下标（找不到记 -1）；
#    ④ sub 在整个 text 中互不重叠出现的总次数。
# 3. 第 3 行（限次替换与不可变性）：仅将 text 中从左数前 2 次出现的 old_s 替换为 new_s（不足 2 次则全部替换），按 <替换后新串> | <未改变的原 text> 输出。
# 4. 第 4 行（左右单刀拆分）：对 log_line 按 ':' 分别执行“从左只切 1 刀”得到首段 left_head 与余串 left_rest，以及“从右只切 1 刀”得到末尾段 right_tail，按 <left_head> | <left_rest> || <right_tail> 输出。
#
# 样例输入：
# abracadabra
# ab
# a @
# user:admin:host=db:port=5432
#
# 样例输出：
# abdcra acar a r
# 0 7 7 2
# @br@cadabra | abracadabra
# user | admin:host=db:port=5432 || port=5432
# 说明：text[::-2]="abdcra"，text[5:1:-1]="acar"，在 "abracadabra" 中 ord('a')=97 最小、ord('r')=114 最大；第2行区间[1,10)跳过索引0的"ab"故从左首次为7；第3行只换前2个a；第4行左右各切1刀。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 为什么在判断或定位一个可能不存在的子串时优先用 find() 而不是 index()？
# 2. "a,,b".split(",") 与 "a  b".split() 各自返回什么？为什么显式传入 sep 时连续分隔符会产生空字符串？
#
# 评测：10 组测试集中在 评测/题库/34.json（重点自测找不到子串、重叠加串、替换不足 2 次与连续冒号空段）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第34题”。
#
# 请在下面写你的代码：

text = input().strip()
sub = input().strip()
old, new = input().split()
log = input().strip()

seq_1 = text[-1::-2]
seq_2 = text[5:1:-1]
ord_min = ord(text[0])
ord_max = ord(text[0])
for ch in text :
    ord_min = min(ord_min, ord(ch))
    ord_max = max(ord_max, ord(ch))
ch_min = chr(ord_min)
ch_max = chr(ord_max)
# ch_min = min(text)
# ch_max = max(text)
print(seq_1, seq_2, ch_min, ch_max)

pos_1 = text.find(sub)
pos_2 = text.rfind(sub)
pos_3 = text.find(sub, 1, len(text) - 1)
cnt = text.count(sub)
print(pos_1, pos_2, pos_3, cnt)

rep = text.replace(old, new, 2)
print(rep, "|", text)

left_head, left_tail = log.split(sep = ':', maxsplit = 1)
right_head, right_tail = log.rsplit(sep = ':', maxsplit = 1)
print(left_head, "|", left_tail, "||", right_tail)

# 思考1：find() 找不到子串时会安全返回 -1，便于用 if pos == -1: 判断分支；而 index() 找不到会直接抛出 ValueError 异常，若未写 try/except 会导致程序崩溃。
# 思考2："a,,b".split(",") 返回 ['a', '', 'b']，"a  b".split() 返回 ['a', 'b']。原因是：显式传入 sep="," 时按“严格定界符”切分——每遇到 1 个逗号就切一刀（两个相邻逗号中间夹着空文本，或首尾紧贴逗号），因此会保留空字符串 "" 以免丢失空字段位置；而无参 split()（即 sep=None）会将任意个连续空白折叠成同一块分隔符并自动忽略首尾空白，故不会产生空字符串。