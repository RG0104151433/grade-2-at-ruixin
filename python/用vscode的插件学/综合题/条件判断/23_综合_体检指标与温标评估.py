# 第 23 题：体检指标与温标评估（第三部分阶段综合题）
# 所属部分：三、输入、类型转换与条件判断；题型：综合应用。
# 参考：课程课件 `lec2-basic-programming.pdf`（温度转换与 IPO）、`lec4-control-structures.pdf`
# （BMI 国际与国内双标准分支、`try/except ValueError`），结合《Python编程：从入门到实践（第2版）》第 5 章，自编综合题。
#
# 综合复习（覆盖第一至三部分核心能力）：
# - 字符串清理、大小写统一与单行多参数解包（`.split()`、`.lower()`）；
# - `try/except ValueError` 与 `is None` 容错校验（避免裸 `except:`，不用 `eval()`）；
# - 数值乘方/温标算式、多分支区间（互斥 `if/elif/else`）、独立逻辑组合与格式化输出。
#
# 输入（共两行，每行均保证恰好两个空白分隔字段，勿打印输入提示）：
# 第 1 行：`h_text w_text`（身高/米 与 体重/千克，可能出现非数字文本或超范围数值）
# 第 2 行：`t_text unit_text`（体温读数 与 温标字母，温标可能大小写混合）
#
# 输出与约束（不使用循环、列表、字典或自定义函数，严禁使用 eval()；按 exact 严格匹配，限时 2 秒）：
# 1. 第 1 行（体温评估）：
#    - 仅当 `t_text` 可转为 float、`unit_text.lower()` 为 `"c"` 或 `"f"`，且换算为摄氏度 `temp_c`
#      后满足 `30.0 <= temp_c <= 45.0` 时有效；否则第 1 行输出 `TEMP_INVALID`。
#    - 换算：C 转 F 为 `temp_c * 1.8 + 32`；F 转 C 为 `(temp_f - 32) / 1.8`。
#    - 状态：`temp_c < 36.0` 为 `LOW`；`36.0 <= temp_c <= 37.3` 为 `NORMAL`；`temp_c > 37.3` 为 `FEVER`。
#    - 有效时输出格式：`TEMP:<temp_c保留1位小数>C/<temp_f保留1位小数>F|<状态>`
# 2. 第 2 行（BMI 双标准评估，对齐课件国际/国内标准）：
#    - 仅当 `h_text`、`w_text` 均可转为 float，且 `0.5 <= height <= 2.5`、`10.0 <= weight <= 300.0`
#      时有效；否则第 2 行输出 `BMI_INVALID`。
#    - 有效时计算 `bmi = weight / (height ** 2)`，按区间映射国际 `intl` / 国内 `dom` 分类：
#      `<18.5`: Thin / Thin；`[18.5, 24)`: Healthy / Healthy；`[24, 25)`: Healthy / Overweight；
#      `[25, 28)`: Overweight / Overweight；`[28, 30)`: Overweight / Obese；`>=30`: Obese / Obese。
#    - 有效时输出格式：`BMI:<bmi保留2位小数>|INT:<intl>|DOM:<dom>`
# 3. 第 3 行（综合分诊结论，按优先级输出一项）：
#    - 体温或 BMI 任一无效 -> `CHECK_RETRY`
#    - 否则若体温非 `NORMAL`（即 `FEVER` 或 `LOW`）-> `MEDICAL_CARE`
#    - 否则若国际与国内分类不同 -> `BORDERLINE_FOLLOWUP`
#    - 否则若国内分类不是 `Healthy` -> `DIET_ADVICE`
#    - 否则 -> `ALL_PASS`
#
# 样例输入：
# 1.60 62.5
# 98.6 f
#
# 样例输出：
# TEMP:37.0C/98.6F|NORMAL
# BMI:24.41|INT:Healthy|DOM:Overweight
# BORDERLINE_FOLLOWUP
# 说明：98.6F 合 37.0C（NORMAL）；bmi=62.5/2.56=24.41 国际 Healthy、国内 Overweight，二者分歧故输出 BORDERLINE_FOLLOWUP。
#
# 末尾思考（请用 # 注释写两句，检查时审阅）：
# 1. 在第 2 行判断 BMI 时，为什么只需写 `elif bmi < 24:` 而不用写 `elif 18.5 <= bmi < 24:`？若把各分支上下顺序打乱会怎样？
# 2. 综合分诊第 3 行里，为什么必须把 `CHECK_RETRY` 放在最前面？如果写成先查 `MEDICAL_CARE` 会出现什么错误？
#
# 评测：14 组测试集中在 评测/题库/23.json（注意 36.0/37.3 体温端点、18.5/24/25/28/30 BMI 端点与异常输入）。
# 保存后按 Ctrl+Shift+B 评测，或告诉我“检查第23题”。
#
# 请在下面写你的代码：

H_text, W_text = input().split()
h_text = H_text.strip()
w_text = W_text.strip()
T_text, Unit_text = input().split()
t_text = T_text.strip()
unit_text = Unit_text.lower()

temp_validity = True
try :
    t = float(t_text)
    if isinstance(t, float) :
        if unit_text == 'f' :
            t_c = (t - 32) / 1.8
            t_f = t
        elif unit_text == 'c' :
            t_c = t
            t_f = t * 1.8 +32
        else :
            print("TEMP_INVALID") # 这个是unit_text不合规的报错
            temp_validity = False
        if temp_validity and (t_c < 30 or t_c > 45) :
            print("TEMP_INVALID") # 这个是数值范围错误的报错
            temp_validity = False
except ValueError :
    print("TEMP_INVALID") # 这个是温度非float的报错 至此，三种TEMP_INVALID处理完毕
    temp_validity = False
if temp_validity :
    if t_c < 36.0 :
        condition = "LOW"
    elif t_c <= 37.3 :
        condition = "NORMAL"
    else :
        condition = "FEVER"
    print(f"TEMP:{t_c:.1f}C/{t_f:.1f}F|{condition}")

bmi_validity = True
try :
    h = float(h_text)
    w = float(w_text)
    if isinstance(h, float) and isinstance(w, float) :
        if h < 0.5 or h > 2.5 or w < 10.0 or w > 300.0 :
            print("BMI_INVALID")
            bmi_validity = False
        else :
            bmi = w / (h ** 2)
    else :
        print("BMI_INVALID")
        bmi_validity = False
except ValueError :
    print("BMI_INVALID")
    bmi_validity = False
if bmi_validity :
    if bmi < 18.5 :
        itn, dom = "Thin", "Thin"
    elif bmi < 24 :
        itn, dom = "Healthy", "Healthy"
    elif bmi < 25 :
        itn, dom = "Healthy", "Overweight"
    elif bmi < 28 :
        itn, dom = "Overweight", "Overweight"
    elif bmi < 30 :
        itn, dom = "Overweight", "Obese"
    else :
        itn, dom = "Obese", "Obese"
    print(f"BMI:{bmi:.2f}|INT:{itn}|DOM:{dom}")

if not temp_validity or not bmi_validity :
    print("CHECK_RETRY")
elif condition != "NORMAL" :
    print("MEDICAL_CARE")
elif itn != dom :
    print("BORDERLINE_FOLLOWUP")
elif dom != "Healthy" :
    print("DIET_ADVICE")
else :
    print("ALL_PASS")