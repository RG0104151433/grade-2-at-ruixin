text = input()
result = []
for ch in text:
    if 'a' <= ch <= 'z':
        # 小写字母逆码
        result.append(chr(ord('a') + ord('z') - ord(ch)))
    elif 'A' <= ch <= 'Z':
        # 大写字母逆码
        result.append(chr(ord('A') + ord('Z') - ord(ch)))
    else:
        # 非字母字符保持不变
        result.append(ch)
print(''.join(result))