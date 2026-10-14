# 1014学点python

# strip相关用法

`strip()` 是 Python 字符串的一个方法，作用是**去除字符串开头和结尾的空白字符**。

默认情况下，它会去掉首尾的空格、制表符 `\t`、换行符 `\n`、回车符 `\r` 等空白字符。它**不会去除字符串中间的空格**，也**不会修改原字符串**，而是返回一个新的字符串。

在你的代码里：

```python
money = input().strip()
```

`input()` 读取用户输入的一行内容后，虽然会自动去掉末尾的换行符，但**不会去掉用户可能多输入的首尾空格**。

比如用户输入：

```text
   $32.3
```

如果直接写：

```python
money = input()
```

那么 `money` 的值是 `"   $32.3   "`，第一个字符是空格，不是 `$`。

这样后面判断：

```python
if money.startswith('$'):
```

就会失败，程序会走到 `else` 分支，误判为格式错误。

加上 `.strip()` 后：

```python
money = input().strip()
```

`money` 就变成了 `"$32.3"`，首尾空格被去掉，判断符号和取金额就正常了。

简单例子：

```python
s = "  $32.3  "
print(s.strip())        # 输出：$32.3
print(s.strip()[0])     # 输出：$
print(s.strip()[1:])    # 输出：32.3
```

所以，`.strip()` 在这里的作用是：**让输入更健壮，防止用户不小心在前后多打空格导致程序判断错误。**

它不影响中间内容，比如 `"$ 32.3"` 去掉首尾空格后还是 `"$ 32.3"`，但 `float(" 32.3")` 本身可以处理数字前面的空格，所以仍然能正确转换。

# Python换行符

是的，在 Python 中，**在字符串里写 `\n` 就可以表示换行**。

例如：

```python
print("第一行\n第二行")
```

输出：

```text
第一行
第二行
```

不过要注意：`\n` 必须写在**字符串里面**，不能直接裸写。

常见换行方式：

### 1. 用 `\n`

```python
print("USD converted to RMB:￥226.95 Yuan\nRMB converted to USD:$4.60 Dollar")
```

输出：

```text
USD converted to RMB:￥226.95 Yuan
RMB converted to USD:$4.60 Dollar
```

### 2. 多次 `print()`，默认就会换行

```python
print("第一行")
print("第二行")
```

输出：

```text
第一行
第二行
```

因为 `print()` 默认结尾会加一个换行符。

### 3. 用三引号写多行字符串

```python
print("""第一行
第二行""")
```

输出：

```text
第一行
第二行
```

### 4. 不想换行，用 `end=""`

```python
print("第一行", end="")
print("第二行")
```

输出：

```text
第一行第二行
```

所以总结：

* 想让一个字符串内部换行：用 `\n`
* 想每次 `print` 后自动换行：默认就是
* 想取消自动换行：用 `end=""`
* 想写多行文本：可以用三引号 `"""..."""`

在你之前的货币转换题里，如果输出要求是两行，可以写成：

```python
print(f"USD converted to RMB:￥{rmb:.2f} Yuan\nRMB converted to USD:${usd:.2f} Dollar")
```

或者分开两次 `print()`。

​

# Python内置len函数

在 Python 中，获取字符串长度使用内置函数 **`len()`**。

语法：

```python
len(字符串)
```

例如：

```python
s = "hello"
print(len(s))   # 输出 5
```

如果是中文：

```python
s = "你好"
print(len(s))   # 输出 2
```

注意几个点：

1. **空格也算长度**

```python
s = "a b"
print(len(s))   # 输出 3，因为中间有一个空格
```

2. **转义字符算一个字符**

```python
s = "a\nb"
print(len(s))   # 输出 3：'a'、'\n'、'b'
```

3. **`len()` 是内置函数，不是字符串方法**

正确写法：

```python
len(s)
```

错误写法：

```python
s.len()
s.length()
```

4. **返回的是字符个数，不是字节数**

```python
s = "你好"
print(len(s))          # 2
print(len(s.encode())) # 6，因为 UTF-8 中一个汉字通常占 3 个字节
```

所以，如果你在货币转换程序里想获取输入字符串的长度，可以这样写：

```python
money = input()
print(len(money))
```

比如输入 `$32.3`，长度为 5。

​

# Python中split生成list

可以，你的理解方向是对的，但要注意 Python 里的具体叫法和一些细节。

刚才代码里：

```python
words = text.split()
```

这里的 `words` 是一个 **列表（list）**，不是 C 里的 `vector`，但你可以把它类比成：

* C++ 里的 `vector<string>`
* 或者 C 里的“字符串数组 + 长度”

也就是说，`words` 里面装的是多个字符串：

```python
text = "Python is easy to learn."
words = text.split()
print(words)
```

输出：

```python
['Python', 'is', 'easy', 'to', 'learn.']
```

这确实很像：

```cpp
vector<string> words = {"Python", "is", "easy", "to", "learn."};
```

然后：

```python
len(words)
```

就是获取这个列表里元素的个数，也就是单词数量。

所以：

```python
print(len(words))
```

输出：

```text
5
```

***

### 对应关系

| **Python**             | **C / C++ 类比**                        |
| ---------------------- | ------------------------------------- |
| `words = text.split()` | `vector<string> words = split(text);` |
| `words`                | 一个字符串列表 / 动态数组                        |
| `words[0]`             | 第一个字符串，类似 `words[0]`                  |
| `len(words)`           | 元素个数，类似 `words.size()`                |
| `for w in words:`      | 遍历每个字符串                               |

***

### 但有几个区别要注意

1. **Python 里没有“vector”这个叫法**

对应的是 `list`，写成：

```python
words = ['Python', 'is', 'easy']
```

2. **`len()` 是内置函数，不是方法**

Python 写：

```python
len(words)
```

不是：

```python
words.len()
words.length()
```

这点和 C++ 的 `words.size()` 不同。

3. **Python 列表可以装不同类型**

虽然这里装的全是字符串，但 Python 的 list 不要求元素类型相同：

```python
mixed = ["hello", 123, 3.14, True]
```

而 C++ 的 `vector<string>` 只能装字符串。

4. **变量名建议用 `words`，不是 `word`**

`words` 表示多个单词，`word` 通常表示单个单词。

***

所以你可以这样理解：

```python
words = text.split()
```

相当于把输入文本按空格切开，得到一个“字符串列表”，类似：

```cpp
vector<string> words;
```

然后：

```python
len(words)
```

就是问这个列表里有多少个字符串，也就是有多少个单词。

你的 C 语言式理解基本正确，只是 Python 里叫 `list`，长度用 `len()` 获取。

​

# Python中的append和join

`append` 和 `join` 是 Python 中非常常用的两个操作，分别用于**列表添加元素**和**字符串拼接**。下面详细讲一下。

***

#### 1. `append`：向列表末尾添加一个元素

`append` 是 **列表（list）** 的方法，语法：

```python
列表名.append(元素)
```

作用：把 `元素` 添加到列表的**末尾**，一次只加一个。

例如：

```python
result = []
result.append('a')
result.append('b')
result.append('c')
print(result)   # ['a', 'b', 'c']
```

对应到你的逆编码程序：

```python
result = []                # 创建一个空列表
for ch in text:
    if 'a' <= ch <= 'z':
        new_ch = chr(ord('a') + ord('z') - ord(ch))
    elif 'A' <= ch <= 'Z':
        new_ch = chr(ord('A') + ord('Z') - ord(ch))
    else:
        new_ch = ch
    result.append(new_ch)  # 把转换后的字符加到列表末尾
```

循环结束后，`result` 里就按顺序保存了所有转换后的字符。

你可以把它类比成 C++ 的：

```cpp
vector<char> result;
result.push_back(new_ch);
```

或者 C 语言里手动维护一个字符数组，只不过 Python 的列表会自动扩容，用起来更方便。

***

#### 2. `join`：把多个字符串拼接成一个字符串

`join` 是 **字符串（str）** 的方法，语法：

```python
分隔符.join(可迭代对象)
```

作用：用 `分隔符` 把可迭代对象中的**字符串元素**连接起来，返回一个新的字符串。

注意：**调用 `join` 的是分隔符字符串，不是列表。**

例如：

```python
words = ['I', 'love', 'Python']
print(' '.join(words))   # I love Python
print('-'.join(words))   # I-love-Python
print(''.join(words))    # IlovePython
```

在逆编码程序中：

```python
print(''.join(result))
```

这里：

* `''` 是空字符串，作为分隔符，表示元素之间不加任何东西。
* `result` 是列表，里面装的是一个个字符。
* `''.join(result)` 就把这些字符无缝拼接成一个完整的字符串。

例如：

```python
result = ['2', '0', '1', '8', '-', 'K', 'b', 'g', 's', 'l', 'm']
print(''.join(result))   # 2018-Kbgslm
```

***

#### 3. 为什么不用字符串直接累加？

你可能会想，为什么不直接：

```python
result = ''
for ch in text:
    ...
    result += new_ch
```

这样也能得到最终字符串，但在 Python 中，字符串是**不可变**的。每次 `+=` 都会创建一个新的字符串对象，如果字符串很长，效率会很低。

而用列表 `append` 收集所有字符，最后一次性 `join`，效率高得多。这是 Python 中拼接大量字符串的推荐写法。

可以类比：

* `append` 像把东西一件件放进箱子。
* `join` 像把箱子里的东西一次性倒出来连成一条。

***

#### 4. 两者结合的工作流程

在你的程序里：

```python
text = input()          # 例如输入 "2018-Python123"
result = []             # 空列表，准备收集结果字符

for ch in text:         # 遍历每个字符
    ...
    result.append(new_ch)   # 把转换后的字符逐个追加到列表

print(''.join(result))  # 把列表里的字符拼成最终字符串并输出
```

整个过程：

1. 创建空列表 `result`。
2. 遍历原字符串，每个字符转换后 `append` 到列表末尾。
3. 循环结束后，`result` 包含所有转换后的字符。
4. 用 `''.join(result)` 把它们连接成一个完整字符串。
5. 打印输出。

***

#### 5. 总结对比

| **操作**   | **属于谁** | **作用**         | **例子**               |
| -------- | ------- | -------------- | -------------------- |
| `append` | 列表的方法   | 在列表末尾添加一个元素    | `result.append('a')` |
| `join`   | 字符串的方法  | 用分隔符把多个字符串连成一个 | `''.join(result)`    |

记忆要点：

* `append`：列表末尾加一个。
* `join`：字符串拼接，分隔符在前，列表在后。
* 拼接大量字符时，先 `append` 到列表，最后 `join`，是 Python 的标准高效做法。

这样解释清楚了吗？如果你愿意，我还可以给你画一个简单的执行过程示意图。

​

# 水仙花数

这段程序试图找出 **100 到 999 之间的“水仙花数”**（也叫阿姆斯特朗数），即三位数中各位数字的立方和等于该数本身的数。例如 $153 = 1^3 + 5^3 + 3^3$。

但是，**原程序无法正确达成目标**，主要有两个问题：

### 问题 1：使用了浮点除法 `/`

```python
n /= 10
```

在 Python 3 中，`/` 是浮点除法，`n` 会变成浮点数（如 `153 / 10 = 15.3`）。后续的 `b = n % 10` 得到的是浮点数（如 `15.3 % 10 = 5.3`），`c` 也是浮点数。这样计算 `a**3 + b**3 + c**3` 得到浮点数，与整数 `i` 比较时由于精度问题几乎不可能相等，导致判断失败。

### 问题 2：只记录了两个数

```python
if x == 0:
    x = i
else:
    y = i
```

这段逻辑只会保存第一个找到的水仙花数和最后一个找到的水仙花数。而三位水仙花数实际有 4 个：**153、370、371、407**。因此原程序最终会输出 `153, 407`，而不是全部。

***

## 修改方案

### 方法一：输出所有水仙花数（推荐）

```python
for i in range(100, 1000):
    n = i
    a = n % 10
    n //= 10          # 使用整除
    b = n % 10
    n //= 10
    c = n
    if a**3 + b**3 + c**3 == i:
        print(i)
```

输出：

```
153
370
371
407
```

### 方法二：用列表收集所有水仙花数

```python
nums = []
for i in range(100, 1000):
    n = i
    a = n % 10
    n //= 10
    b = n % 10
    n //= 10
    c = n
    if a**3 + b**3 + c**3 == i:
        nums.append(i)
print(nums)
```

输出：

```
[153, 370, 371, 407]
```

### 方法三：更简洁的字符串法

```python
for i in range(100, 1000):
    s = str(i)
    if int(s[0])**3 + int(s[1])**3 + int(s[2])**3 == i:
        print(i)
```

***

## 总结

* **原程序目的**：寻找三位水仙花数。
* **能否达成**：不能，因为浮点除法和只记录两个数的逻辑。
* **怎么改**：将 `/=` 改为 `//=`，并根据需要输出所有结果或收集到列表。

```python
nums = []
for i in range(100, 1000):
    a = i // 100
    b = (i // 10) % 10
    c = i % 10
    if a**3 + b**3 + c**3 == i:
        nums.append(str(i))

print(", ".join(nums))
```

运行后会输出：

```
153, 370, 371, 407
```

说明：

* 遍历所有三位数 `100` 到 `999`。
* 分别取出百位 `a`、十位 `b`、个位 `c`。
* 判断 $a^3 + b^3 + c^3$ 是否等于原数。
* 用 `", ".join(nums)` 按格式拼接，最后一个数字后没有逗号，逗号后有一个空格。
* 程序不需要任何输入，直接输出结果。

​
