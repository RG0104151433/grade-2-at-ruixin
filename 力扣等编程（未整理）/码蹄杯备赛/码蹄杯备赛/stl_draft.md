# STL 容器与算法速通手册

> 面向码蹄杯国赛的 C++ STL 精简版
> 只写竞赛中真正会用到的，不写底层原理，不写冷门操作

---

## 第1章 概述与导读

### 文档定位
- 面向码蹄杯 ACM 赛制，只覆盖 **竞赛高频** 的 STL 用法
- 每个容器只写 3-5 个最常用的操作 + 一个完整示例
- 默认你已经会用 C++ 基本语法，但没系统学过 STL

### 优先级说明
- **【必看】** ：不掌握就写不了题，必须学
- **【建议看】** ：能提高做题效率，1小时内能掌握
- **【选看】** ：偶尔能用上，不影响核心做题

### 阅读建议
- 时间紧张时：第2+3+5+7章（必看4章），约1.5小时
- 时间充裕时：全部8章，约2.5小时
- 考前快速翻：第6+8章（坑和决策指南），10分钟

---

## 第2章 序列容器【必看】

### 2.1 vector —— 竞赛最常用容器

**本质：** 动态数组，可自动扩容，支持随机访问。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `vector<int> v;` | 默认空 |
| 定义+大小 | `vector<int> v(n);` | 初始化为n个0 |
| 定义+大小+初值 | `vector<int> v(n, -1);` | n个-1 |
| 尾部插入 | `v.push_back(x);` | O(1)均摊 |
| 尾部构造 | `v.emplace_back(x);` | 比push_back少一次拷贝，性能更好 |
| 访问 | `v[i]` 或 `v.at(i)` | O(1)，at会检查越界 |
| 大小 | `v.size()` | 返回无符号整数 |
| 调整大小 | `v.resize(n);` | 扩大填0，缩小丢弃 |
| 预留空间 | `v.reserve(n);` | 提前分配内存，避免多次扩容 |
| 清空 | `v.clear();` | 不释放内存 |
| 判空 | `v.empty()` | 比 `v.size()==0` 略快 |
| 首尾元素 | `v.front()` / `v.back()` | 空容器会崩 |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    // 邻接表：vector<int> adj[n+1]
    vector<int> adj[5];  // 5个vector
    adj[1].push_back(2);
    adj[1].push_back(3);
    adj[2].push_back(4);
    
    // 遍历邻接表
    for (int v : adj[1]) cout << v << " ";  // 输出 2 3
    
    // 存结果排序
    vector<int> res = {5, 3, 1, 4, 2};
    sort(res.begin(), res.end());  // 1 2 3 4 5
    
    // 二维数组
    vector<vector<int>> grid(n, vector<int>(m, 0));
}
```

**关键细节：**
- `size()` 返回 `size_t`（无符号），和 `int` 比较时编译器会警告，建议 `v.size()` 或 `(int)v.size()`
- for-each 遍历时不要修改容器大小（会导致迭代器失效）
- 提前 `reserve` 能显著提升性能，如已知要存 n 个元素时先 `reserve(n)`

---

### 2.2 string —— 文本处理基础

**本质：** 字符动态数组，支持 vector 的所有操作 + 字符串特有方法。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `string s;` | 空字符串 |
| 定义+初值 | `string s = "hello";` | |
| 长度 | `s.length()` 或 `s.size()` | 一样 |
| 访问 | `s[i]` | O(1) |
| 拼接 | `s + "world"` 或 `s += '!'` | |
| 查找 | `s.find("lo")` | 返回下标，找不到返回 `string::npos` |
| 子串 | `s.substr(pos, len)` | 从pos开始取len个字符 |
| 追加 | `s.append("xxx")` | 同 `s += "xxx"` |
| 插入 | `s.insert(pos, "xxx")` | |
| 删除 | `s.erase(pos, len)` | |
| 转数字 | `stoi(s)` / `stoll(s)` | string -> int/long long |
| 数字转字符串 | `to_string(x)` | int/long long -> string |
| 判空 | `s.empty()` | |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    string s = "hello world";
    
    // 查找
    size_t pos = s.find("world");  // 返回 6
    if (pos != string::npos) {
        cout << "found at " << pos << "\n";
    }
    
    // 子串
    string sub = s.substr(6, 5);  // "world"
    
    // 数字处理
    string num = "114514";
    int x = stoi(num);  // 114514
    string back = to_string(x);  // "114514"
    
    // 遍历
    for (char c : s) {
        if (c == ' ') continue;
        cout << c;
    }
}
```

**关键细节：**
- `find` 返回 `size_t`，判断是否找到必须用 `string::npos`，不要用 `>=0`（无符号数永远>=0）
- `substr` 如果 len 超出字符串长度，自动取到末尾，不会越界
- 大量拼接时用 `+=` 或 `append`，不要用 `s = s + "xxx"`（后者会创建临时对象）
- 刷题时常用 `getline(cin, s)` 读入带空格的整行

---

## 第3章 适配器容器【必看】

### 3.1 stack —— 栈

**本质：** LIFO（后进先出），底层默认用 deque 实现。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `stack<int> st;` | |
| 入栈 | `st.push(x);` | |
| 出栈 | `st.pop();` | 不返回元素 |
| 栈顶 | `st.top()` | |
| 判空 | `st.empty()` | |
| 大小 | `st.size()` | |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    stack<int> st;
    st.push(1);
    st.push(2);
    st.push(3);
    
    while (!st.empty()) {
        cout << st.top() << " ";  // 3 2 1
        st.pop();
    }
}
```

**注意：** 没有 `pop()` 同时返回栈顶的操作，需要先 `top()` 再 `pop()`。

---

### 3.2 queue —— 队列

**本质：** FIFO（先进先出），BFS 标配。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `queue<int> q;` | |
| 入队 | `q.push(x);` | |
| 出队 | `q.pop();` | 不返回元素 |
| 队首 | `q.front()` | |
| 队尾 | `q.back()` | |
| 判空 | `q.empty()` | |
| 大小 | `q.size()` | |

**BFS 标准模板：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int bfs(int start, int target, vector<int> adj[]) {
    vector<int> dist(n + 1, -1);
    queue<int> q;
    q.push(start);
    dist[start] = 0;
    
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == target) return dist[u];
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return -1;
}
```

---

### 3.3 priority_queue —— 优先队列（堆）

**本质：** 默认大根堆（最大值在堆顶）。Dijkstra 堆优化必备。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义（大根堆） | `priority_queue<int> pq;` | 默认 |
| 定义（小根堆） | `priority_queue<int, vector<int>, greater<int>> pq;` | 注意两个 `>` 之间要空格 |
| 入堆 | `pq.push(x);` | O(log n) |
| 出堆 | `pq.pop();` | 不返回元素 |
| 堆顶 | `pq.top()` | |
| 判空 | `pq.empty()` | |

**Dijkstra 堆优化示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef pair<int, int> pii;  // (距离, 节点编号)

void dijkstra(int start, vector<pii> adj[], int n) {
    vector<int> dist(n + 1, INT_MAX);
    priority_queue<pii, vector<pii>, greater<pii>> pq;  // 小根堆
    pq.push({0, start});
    dist[start] = 0;
    
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;  // 过期节点，跳过
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}
```

**关键细节：**
- 自定义比较时注意：小根堆用 `greater<>`，大根堆用 `less<>`（默认）
- 自定义结构体做堆元素时，需要重载 `<` 运算符，或传自定义比较函数
- 用 `pair` 时默认按 first 排序，适合 Dijkstra 的 `(距离, 节点)` 模式

---

## 第4章 关联与无序容器【建议看】

### 4.1 map / unordered_map

**本质：** 键值对映射。`map` 基于红黑树（有序，O(log n)），`unordered_map` 基于哈希表（无序，O(1)均摊）。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `map<string, int> mp;` | |
| 插入 | `mp["key"] = val;` | 如果key不存在会创建 |
| 安全插入 | `mp.insert({"key", val});` | 已存在时不覆盖 |
| 查找 | `mp.find("key")` | 返回迭代器，找不到返回 `mp.end()` |
| 判断存在 | `mp.count("key")` | 返回0或1（map中） |
| 访问值 | `mp["key"]` | 如果key不存在会创建并赋默认值 |
| 删除 | `mp.erase("key");` | |
| 遍历 | `for (auto &p : mp)` | p 是 pair |

**选型对比：**

| 场景 | 用哪个 |
|------|--------|
| 需要按键排序 | `map` |
| 需要遍历时按顺序输出 | `map` |
| 只关心查找速度，不关心顺序 | `unordered_map` |
| 键是自定义结构体 | `map`（unordered需自定义哈希） |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    // 统计词频
    unordered_map<string, int> freq;
    vector<string> words = {"apple", "banana", "apple", "orange", "banana", "apple"};
    
    for (string &w : words) {
        freq[w]++;  // 不存在时自动创建，初始化为0，然后++
    }
    
    // 输出
    for (auto &p : freq) {
        cout << p.first << ": " << p.second << "\n";
    }
    
    // 查找
    if (freq.count("apple")) {
        cout << "apple appears " << freq["apple"] << " times\n";
    }
}
```

**关键细节：**
- `mp["key"]` 如果 key 不存在，会**创建**并赋默认值（int 为 0），所以只用 `mp["key"]` 读取前要确认 key 存在
- 遍历时删除元素必须用迭代器：`mp.erase(it++);`
- 竞赛中能用 `unordered_map` 就别用 `map`，O(1) 比 O(log n) 快很多

---

### 4.2 set / unordered_set

**本质：** 集合。`set` 有序，`unordered_set` 无序哈希。

**核心操作：**

| 操作 | 写法 | 说明 |
|------|------|------|
| 定义 | `set<int> s;` | |
| 插入 | `s.insert(x);` | 已存在时不插入 |
| 删除 | `s.erase(x);` | |
| 查找 | `s.count(x)` | 存在返回1，否则0 |
| 查找 | `s.find(x)` | 返回迭代器 |
| 清空 | `s.clear();` | |
| 遍历 | `for (int x : s)` | 有序时按升序 |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    // 去重
    vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5};
    set<int> s(v.begin(), v.end());
    // s 包含 {1, 2, 3, 4, 5, 6, 9}
    
    // 快速判断
    if (s.count(5)) cout << "5 exists\n";  // 存在
    if (!s.count(7)) cout << "7 not found\n";  // 不存在
    
    // 有序遍历
    for (int x : s) cout << x << " ";  // 1 2 3 4 5 6 9
}
```

---

## 第5章 常用算法【必看】

### 5.1 sort —— 排序

**核心用法：**

```cpp
#include <bits/stdc++.h>
using namespace std;

// 自定义比较函数
bool cmp(int a, int b) {
    return a > b;  // 降序
}

int main() {
    vector<int> v = {5, 3, 1, 4, 2};
    
    // 默认升序
    sort(v.begin(), v.end());  // 1 2 3 4 5
    
    // 自定义比较——函数指针
    sort(v.begin(), v.end(), cmp);  // 5 4 3 2 1
    
    // 自定义比较——lambda（竞赛推荐写法）
    sort(v.begin(), v.end(), [](int a, int b) {
        return a > b;  // 降序
    });
    
    // 对结构体排序
    struct Node { int x, y; };
    vector<Node> nodes = {{3, 1}, {1, 2}, {2, 3}};
    sort(nodes.begin(), nodes.end(), [](Node &a, Node &b) {
        if (a.x != b.x) return a.x < b.x;  // 按x升序
        return a.y < b.y;                   // x相同按y升序
    });
}
```

**关键细节：**
- `sort` 时间复杂度 O(n log n)，不是稳定排序，需要稳定用 `stable_sort`
- 自定义比较函数必须满足**严格弱序**（strict weak ordering）：a < b 和 b < a 不能同时为 true
- 比较函数返回 `true` 表示 a 应该排在 b 前面

---

### 5.2 lower_bound / upper_bound —— 二分查找三件套

**使用前提：** 数组必须已排序（升序）。

| 操作 | 作用 | 示例 |
|------|------|------|
| `lower_bound(begin, end, x)` | 第一个 **>= x** 的位置 | `{1,2,4,5}` 找3 → 指向4 |
| `upper_bound(begin, end, x)` | 第一个 **> x** 的位置 | `{1,2,4,5}` 找3 → 指向4 |
| `binary_search(begin, end, x)` | 判断x是否存在 | 返回 bool |

**完整示例：**

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> v = {1, 2, 4, 4, 5, 7, 9};
    
    // 找第一个 >= 4 的位置
    auto it = lower_bound(v.begin(), v.end(), 4);
    int idx = it - v.begin();  // 2 (v[2]=4)
    
    // 找第一个 > 4 的位置
    auto it2 = upper_bound(v.begin(), v.end(), 4);
    int idx2 = it2 - v.begin();  // 4 (v[4]=5)
    
    // 统计4出现次数
    int cnt = upper_bound(v.begin(), v.end(), 4) 
            - lower_bound(v.begin(), v.end(), 4);  // 2
    
    // 判断是否存在
    bool has = binary_search(v.begin(), v.end(), 5);  // true
    
    // 降序数组时用 greater 版本
    vector<int> desc = {9, 7, 5, 4, 4, 2, 1};
    auto it3 = lower_bound(desc.begin(), desc.end(), 4, greater<int>());
    // 第一个 <= 4 的位置
}
```

**关键细节：**
- 返回的是迭代器，用 `it - v.begin()` 得到下标
- 下标范围是 `[0, n]`，如果找不到合适值，返回 `end()`（即下标 n）
- 比手写二分稳定得多，**竞赛中能用 STL 二分就别手写**

---

### 5.3 pair —— 二元组

**本质：** 两个元素的打包，配合 sort 和 priority_queue 使用。

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    // 构造
    pair<int, int> p = {3, 5};
    pair<int, string> p2 = make_pair(1, "hello");
    
    // 访问
    cout << p.first << " " << p.second;  // 3 5
    
    // pair 排序：默认按 first 升序，first 相同按 second 升序
    vector<pair<int, int>> v = {{3, 1}, {1, 2}, {3, 2}};
    sort(v.begin(), v.end());  // {1,2}, {3,1}, {3,2}
    
    // 自定义排序
    sort(v.begin(), v.end(), [](auto &a, auto &b) {
        if (a.second != b.second) return a.second < b.second;
        return a.first < b.first;
    });
    
    // C++17 结构化绑定
    for (auto [x, y] : v) {
        cout << x << " " << y << "\n";
    }
}
```

---

## 第6章 常见坑与调试指南【建议看】

### 6.1 迭代器失效

**vector 插入/删除时：** 插入或删除元素后，指向该位置之后的所有迭代器、指针、引用都失效。

```cpp
// ❌ 错误写法
vector<int> v = {1, 2, 3, 4, 5};
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it % 2 == 0) v.erase(it);  // eraser后it失效，++it未定义行为
}

// ✅ 正确写法
for (auto it = v.begin(); it != v.end(); ) {
    if (*it % 2 == 0) it = v.erase(it);  // erase返回下一个有效迭代器
    else ++it;
}
```

**map 遍历中删除：**

```cpp
// ✅ 正确写法
map<int, int> mp;
for (auto it = mp.begin(); it != mp.end(); ) {
    if (it->second == 0) mp.erase(it++);  // 先++再删，it指向下一个
    else ++it;
}
```

### 6.2 空容器访问

```cpp
vector<int> v;
v.front();  // ❌ 未定义行为，可能崩溃
v.back();   // ❌ 同上
v.pop_back(); // ❌ 同上

stack<int> st;
st.top();   // ❌ 空栈访问栈顶，崩溃

// ✅ 必须判空
if (!v.empty()) cout << v.front();
if (!st.empty()) cout << st.top();
```

### 6.3 自定义类型缺比较运算符

```cpp
// ❌ 直接放结构体到 set 或 priority_queue 报错
struct Node { int x, y; };
set<Node> s;  // 编译错误：需要 < 运算符

// ✅ 重载 < 运算符
struct Node {
    int x, y;
    bool operator<(const Node &other) const {
        if (x != other.x) return x < other.x;
        return y < other.y;
    }
};

// ✅ 或者传入比较函数
struct cmp {
    bool operator()(const Node &a, const Node &b) const {
        return a.x < b.x;
    }
};
set<Node, cmp> s;
```

### 6.4 排序稳定性问题

```cpp
// sort 不稳定，等值元素相对顺序可能改变
// 需要稳定排序时用 stable_sort
vector<pair<int, int>> v = {{1, 1}, {2, 1}, {1, 2}};
stable_sort(v.begin(), v.end(), [](auto &a, auto &b) {
    return a.first < b.first;
});
// stable_sort 保证 {1,1} 在 {1,2} 前面
```

### 6.5 调试技巧

```cpp
// 1. 输出 vector
void print(vector<int> &v) {
    for (int i = 0; i < v.size(); i++) {
        cout << v[i] << " \n"[i == v.size() - 1];
    }
}

// 2. 输出 map
void print(map<int, int> &mp) {
    for (auto &[k, v] : mp) {
        cout << k << ":" << v << " ";
    }
    cout << "\n";
}

// 3. 断言检查
#include <cassert>
assert(v.size() > 0);  // 条件不满足时程序终止，快速定位错误
```

---

## 第7章 竞赛实战技巧【必看】

### 7.1 输入输出加速

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    // 关闭 C++ 流与 C 标准 IO 的同步，加速 cin/cout
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    
    // 现在 cin/cout 和 scanf/printf 速度相当
    int n;
    cin >> n;
    vector<int> v(n);
    for (int &x : v) cin >> x;
    // ...
}
```

**注意：** 加上这行后，**不能混用** `cin/cout` 和 `scanf/printf`。如果混用，关闭同步的 cin 会看到空的输入缓冲区。

### 7.2 类型别名

```cpp
// 减少重复书写，提高可读性
using ll = long long;
using pii = pair<int, int>;
using vi = vector<int>;
using vvi = vector<vector<int>>;

// 或老式写法
typedef long long ll;
typedef pair<int, int> pii;
```

### 7.3 容器嵌套

```cpp
// 邻接表（带权图）
vector<vector<pair<int, int>>> adj(n + 1);
// 等价于
vector<pii> adj[n + 1];

// 使用
using vvpii = vector<vector<pair<int, int>>>;
vvpii adj(n + 1);

// 或者
vector<vector<pair<int, int>>> adj(n + 1);
// 局部变量声明时可以用 auto
auto &edges = adj[u];  // 引用，避免拷贝
```

### 7.4 码蹄杯常见题型 STL 组合方案

| 题型 | 推荐 STL 组合 |
|------|---------------|
| 图上最短路径 | `vector<pii> adj[]` + `priority_queue<pii, vector<pii>, greater<pii>>` |
| 并查集 | `vector<int> parent` + `vector<int> rank/size` |
| 拓扑排序 | `vector<int> adj[]` + `vector<int> indeg` + `queue<int>` |
| 排序/第k大 | `vector` + `sort` / `nth_element` |
| 去重/快速查找 | `unordered_set` / `unordered_map` |
| 区间查找 | `vector` + `lower_bound` / `upper_bound` |
| 全排列/组合 | `vector` + `next_permutation` |
| 大数累加 | `long long` + `accumulate` |

---

## 第8章 快速决策指南【建议看】

### 8.1 选型速查表

| 需要 | 选哪个 |
|------|--------|
| 动态数组，随机访问 | `vector` |
| 先进先出，BFS | `queue` |
| 后进先出，DFS非递归 | `stack` |
| 动态取最大/最小 | `priority_queue` |
| 按键值映射，O(1)查找 | `unordered_map` |
| 按键值映射，需有序 | `map` |
| 去重+快速查找 | `unordered_set` |
| 去重+有序遍历 | `set` |
| 排序 | `sort` |
| 二分查找 | `lower_bound` / `upper_bound` |
| 字符串处理 | `string` |

### 8.2 复杂度速查表

| 容器 | 插入 | 删除 | 查找 | 随机访问 |
|------|------|------|------|----------|
| `vector`（尾部） | O(1)均摊 | O(1) | O(n) | O(1) |
| `vector`（中间） | O(n) | O(n) | — | O(1) |
| `deque`（两端） | O(1)均摊 | O(1) | O(n) | O(1) |
| `map` / `set` | O(log n) | O(log n) | O(log n) | — |
| `unordered_map/set` | O(1)均摊 | O(1)均摊 | O(1)均摊 | — |
| `priority_queue` | O(log n) | O(log n) | — | O(1)（仅top） |

### 8.3 常用算法复杂度

| 算法 | 复杂度 |
|------|--------|
| `sort` | O(n log n) |
| `stable_sort` | O(n log n) |
| `lower_bound` / `upper_bound` | O(log n) |
| `binary_search` | O(log n) |
| `next_permutation` | O(n) |
| `accumulate` | O(n) |
| `nth_element` | O(n) |

---

> **写到最后：** 这8章覆盖了码蹄杯国赛 90% 以上的 STL 使用场景。必看部分（第2+3+5+7章）约1.5小时能读完，看完后建议直接上手做几道题巩固。第6+8章考前10分钟快速翻一遍，能帮你避掉大部分常见的 STL 坑。
