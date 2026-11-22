# 第 22 题：嵌套分支与独立判定（第三部分基础题 4）
# 所属部分：三、输入、类型转换与条件判断；题型：基础训练。
# 参考：《Python编程：从入门到实践（第2版）》5.3～5.4 多个条件判断，结合课程课件
# `lec4-control-structures.pdf` 分支结构，自编题。
#
# 新知识：
# 1. 嵌套分支：外层条件满足后，再根据内层条件细分处理（内层缩进再往右移 4 空格）。
# 2. 互斥 `if/elif/else` vs 独立多个 `if`：
#    - 互斥分段（同一事物只可能落入一档）用 `if / elif / else`；
#    - 彼此可同时生效、需要叠加的规则（如基础费 + 会员折扣 + 优惠券减免）必须用多个并列的 `if`，
#      如果误写成 `elif`，命中前面一条后就会把后面的叠加规则跳过。
#
# 输入（一行 4 个空白分隔参数，仅处理一组，勿打印输入提示）：
# weight       包裹重量，单位 kg（浮点数，0 < weight <= 100）
# is_member    是否会员，字符串 yes 或 no（不区分大小写，需先 .lower() 统一）
# is_express   是否加急，字符串 yes 或 no（不区分大小写，需先 .lower() 统一）
# coupon_code  优惠券码（无空格字符串，如 SAVE5、NONE）
#
# 输出与约束（不使用循环、列表或自定义函数；按 exact 严格匹配，限时 2 秒）：
# 计费规则：
# 1) 基础运费（互斥分段）：weight <= 1 为 10.0 元；1 < weight <= 5 为 10.0 + (weight - 1) * 4.0 元；
#    weight > 5 为 26.0 + (weight - 5) * 3.0 元。
# 2) 加急费（嵌套分支）：仅当 is_express == "yes" 时加收——会员加 5.0 元，非会员加 12.0 元。
# 3) 折扣与减免（按顺序独立叠加）：若是会员，总费用打 8 折（* 0.8）；之后若 coupon_code == "SAVE5"
#    且当前费用 >= 10，再减 5.0 元。
# 输出三行：
# 第 1 行：基础运费（保留 2 位小数，不带单位）
# 第 2 行：最终总费用（保留 2 位小数，不带单位）
# 第 3 行：会员加急状态——既是会员又加急输出 VIP_EXPRESS；是会员但不加急输出 VIP_STANDARD；其余输出 NORMAL。
#
# 样例输入：
# 3.0 YES yes SAVE5
#
# 样例输出：
# 18.00
# 13.40
# VIP_EXPRESS
# 说明：基础费 10+(3-1)*4=18.00；会员加急 +5 得 23.0；8 折得 18.4；>=10 且用 SAVE5 减 5 得 13.40。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 计算最终运费时，为什么“会员 8 折”和“SAVE5 减 5 元”不能写成 `if ... elif ...`？
# 2. 如果把顺序反过来（先减 5 元再打 8 折），和题目规定的“先打 8 折再减 5 元”结果一样吗？差多少？
#
# 评测：12 组测试集中在 评测/题库/22.json（重点自测 weight==1、weight==5、折后刚好 10 与大小写混合）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第22题”。
#
# 请在下面写你的代码：

Weight, Is_member, Is_express, Coupon_code = input().split()
weight = float(Weight.strip())
is_member = Is_member.strip().lower()
is_express = Is_express.strip().lower()
coupon_code = Coupon_code.strip()
if weight <= 1 :
    base_fee = 10.0
elif 1 < weight <= 5 :
    base_fee = 10.0 + (weight - 1) * 4.0
else :
    base_fee = 26.0 + (weight - 5) * 3.0
print(f"{base_fee:.2f}")
if is_express == "yes" :
    if is_member == "yes" :
        urgent_fee = (base_fee + 5.0) * 0.8
    else :
        urgent_fee = base_fee + 12.0
else :
    if is_member == "yes" :
        urgent_fee = base_fee * 0.8
    else :
        urgent_fee = base_fee
if coupon_code == "SAVE5" and urgent_fee >= 10 :
    urgent_fee -= 5.0
print(f"{urgent_fee:.2f}")
if is_member == "yes" :
    if is_express == "yes" :
        print("VIP_EXPRESS")
    else :
        print("VIP_STANDARD")
else :
    print("NORMAL")
# 从逻辑上二者就不是排斥的
# 肯定不一样，差一块