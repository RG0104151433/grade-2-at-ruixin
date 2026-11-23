# 第 24 题：跨零点停车与优惠仲裁（第三部分阶段挑战题）
# 所属部分：三、输入、类型转换与条件判断；题型：挑战应用。
# 参考：课程课件 `lec4-control-structures.pdf`（多条件规则、边界区间、重叠与互斥仲裁、`is` vs `==`），
# 结合《Python编程：从入门到实践（第2版）》第 5 章与《Python编程快速上手》3.8 异常处理，自编阶段挑战题。
#
# 挑战目标：独立拆解时间换算、向上取整计费单位、多档累计阶梯、跨夜时段判定与互斥优惠冲突。
#
# 输入（单行，保证恰好 5 个空白分隔字段，勿打印输入提示）：
# in_code out_code overnight pass_type coupon_text
# - in_code / out_code：4 位 HHMM 整数形式（如 0830、2350；合法范围为整数 0～2359 且小时 0～23、分钟 0～59）
# - overnight：是否跨夜至次日出场，字符串 yes 或 no（不区分大小写）
# - pass_type：月卡类型，NONE / VIP / NIGHT（不区分大小写）
# - coupon_text：现金券抵扣面额，整数 0～50
#
# 输出与约束（不使用循环、列表、字典或自定义函数，严禁使用 eval()；按 exact 严格匹配，限时 2 秒）：
# 1. 非法记录拦截：
#    若数字解析失败、范围/枚举不合法，或 `overnight == "no"` 时出场时刻早于入场时刻，仅输出一行 `INVALID_RECORD`。
# 2. 计费规则（合法记录按此顺序结算）：
#    - 停放时长 `mins`：当日出场为 `out_min - in_min`；跨夜为 `(1440 - in_min) + out_min`（`overnight == "yes"` 且同刻计 1440 分钟）。
#    - 15 分钟内免单：`mins <= 15` 时计费单位 `units = 0`，原价与实付均为 `0.00`，卡与券均不生效。
#    - 超过 15 分钟：`units` 为从第 1 分钟起每满/不足 30 分钟均按 1 个半小时向上计费（如 16 分钟算 1 单位，31 分钟算 2 单位）。
#      累计阶梯原价 `raw_fee`：第 1～2 单位每单位 4.00 元；第 3～6 单位每单位 3.00 元；第 7 单位起每单位 2.00 元。
#    - 卡/封顶规则（优先于现金券，若卡生效则现金券不可叠加）：
#      * `NIGHT`：仅当入场 `>= 20:00` 且（同日出场 或 跨夜但次日 `<= 08:00` 出场）时生效，实际费用封顶 10.00 元（原价不足 10 元按原价）。
#        注意：若在非夜间窗口刷 `NIGHT` 卡，卡不生效，回退按无卡规则结算（且后续仍可用现金券）。
#      * `VIP`：原价打 8 折，并受 36.00 元封顶保护（卡必定生效，屏蔽现金券）。
#      * 无卡或 `NIGHT` 未生效：原价受 50.00 元封顶保护。
#    - 现金券规则：仅当“无卡生效”且 `coupon > 0` 且当前封顶后费用 `>= 20.00` 元时抵扣，最低扣至 `0.00` 元（不得为负）。
# 3. 合法记录输出 3 行：
#    第 1 行：`<mins> <units>`
#    第 2 行：`<raw_fee保留2位小数> <实付fee保留2位小数>`
#    第 3 行：实际生效标签——`FREE`（<=15分）、`NIGHT_PASS`、`VIP_PASS`、`COUPON`、`STANDARD`（未享受任何卡或券）之一。
#
# 样例输入：
# 1959 2230 no NIGHT 10
#
# 样例输出：
# 151 6
# 20.00 10.00
# COUPON
# 说明：19:59 早于 20:00 故 NIGHT 卡未生效，6 单位原价 20.00；回退后满足 >=20.00，抵扣 10 元券得 10.00，标签 COUPON。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 判断能否使用现金券时，为什么不能直接检查 `pass_type == "NONE"`，而要记录 `pass_applied`（卡是否真正生效）？
# 2. 如果有变量 `x = None` 和 `a = 1000`、`b = 1000`，为什么检查空值推荐写 `x is None`，而比较数字不能靠 `a is b` 代替 `a == b`？
#
# 评测：16 组测试集中在 评测/题库/24.json（重点自测 15/16/30/31 分钟、19:59/20:00/08:00/08:01 边界、NIGHT 失败回退与大额券归零）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第24题”。
#
# 请在下面写你的代码：

import sys
# 处理输入并进行转换、校错
In_code, Out_code, Overnight, Pass_type, Coupon_text = input().split()
overnight = Overnight.lower()
pass_type = Pass_type.lower()
coupon = int(Coupon_text)
valid = True
try :
    in_code = int(In_code)
    out_code = int(Out_code)
    if in_code // 100 > 23 or out_code // 100 > 23 or in_code % 100 >= 60 or out_code % 100 >= 60 :
        print("INVALID_RECORD") # 范围不合法
        valid = False
    if overnight == "no" and in_code > out_code :
        print("INVALID_RECORD") # 时间不合法
        valid = False
    if coupon < 0 or coupon > 50 :
        print("INVALID_RECORD") # 券不合法
        valid = False
except ValueError :
    print("INVALID_RECORD") # 数字解析失败
    valid = False

if not valid :
    sys.exit(0)

# 计算分钟数
if overnight == "no" :
    mins = 60 * (out_code // 100 - in_code // 100) + out_code % 100 - in_code % 100
else :
    mins = out_code // 100 * 60 + out_code % 100 + (1440 - in_code // 100 * 60 - in_code % 100)

# 计算计时单位数
if mins <= 15 :
    units = 0
else :
    units = (mins + 29) // 30

# 计算原始金额
if units == 0 :
    raw_fee = 0
    final = 0
    condition = "FREE"
elif units < 3 :
    raw_fee = 4.00 * units
elif units < 7 :
    raw_fee = 2.00 + 3.00 * units
else :
    raw_fee = 8.00 + 2.00 * units

# 处理特殊情况
card_used = False
if units > 0 :
    if pass_type == "night" and in_code >= 2000 and (overnight == "no" and out_code >= 2000 or overnight == "yes" and out_code <= 800):
        card_used = True
        condition = "NIGHT_PASS"
        final = raw_fee if raw_fee <= 10.0 else 10.0
    elif pass_type == "vip" :
        card_used = True
        condition = "VIP_PASS"
        mid = raw_fee * 0.8
        final = mid if mid < 36.0 else 36.0
    else :
        if not card_used :
            final = raw_fee if raw_fee <= 50.0 else 50.0
    if not card_used and coupon > 0 and coupon <= 50 and raw_fee >= 20.0 :
        final = final - coupon if final - coupon >= 0.0 else 0.0
        card_used = True
        condition = "COUPON"
    if not card_used :
        condition = "STANDARD"

# 最终输出
print(f"{mins} {units}\n{raw_fee:.2f} {final:.2f}\n{condition}")