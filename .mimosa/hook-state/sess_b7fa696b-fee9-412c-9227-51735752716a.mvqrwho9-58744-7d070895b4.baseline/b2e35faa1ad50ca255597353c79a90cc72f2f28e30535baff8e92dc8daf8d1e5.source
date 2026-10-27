''' Note:Do not add parameters to the input() function, and do not take the form of input ("input:"), otherwise the test case design may be ambiguous'''
# CurrencyConversion
# 1USD=7.0263RMB
# Prompt before entering
print("Please input a currency value with a symbol($10 or ￥10):")
money = input().strip()
# Determine whether it is USD and perform conversion
if money.startswith('$'):
    amount = float(money[1:])
    rmb = amount * 7.0263
    print(f"USD converted to RMB：￥{rmb:.2f} Yuan")
# Determine whether it is RMB and perform conversion
elif money.startswith('￥') or money.startswith('¥'):
    amount = float(money[1:])
    usd = amount / 7.0263
    print(f"RMB converted to USD：${usd:.2f} Dollar")
# Prompt when entering an error format
else:
   print("Invalid input format.")