---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 1725600406963289_0/project_7657932970459873555-files/STL速通/map_unordered_map精讲.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 1725600406963289#1791701833606
    ReservedCode2: ""
---
# map & unordered_map 精讲

> 面向算法竞赛与工程实践，聚焦底层原理、用法细节和常见坑点

---

## 目录

- [第1章 底层原理](#第1章-底层原理)
- [第2章 基本用法](#第2章-基本用法)
- [第3章 进阶操作](#第3章-进阶操作)
- [第4章 算法应用场景](#第4章-算法应用场景)
- [第5章 选型决策](#第5章-选型决策)
- [附录：速查表](#附录速查表)

---

## 第1章 底层原理

### 1.1 map — 红黑树

```cpp
#include <map>
```

- **底层结构**：红黑树（Red-Black Tree），一种自平衡二叉搜索树
- **有序性**：键按 `<` 比较自动升序排列
- **时间复杂度**：插入、删除、查找均为 **O(log n)**
- **迭代器**：双向迭代器，按中序遍历得到有序序列

**结构示意：**

```
        [8]
       /   \
    [3]     [10]
   /   \       \
 [1]   [6]     [14]
      /  \     /
    [4]  [7] [12]
```

### 1.2 unordered_map — 哈希表

```cpp
#include <unordered_map>
```

- **底层结构**：哈希表（Hash Table），桶（bucket）数组 + 链地址法
- **无序性**：元素存储位置由哈希函数决定，无固定顺序
- **时间复杂度**：插入、删除、查找 **平均 O(1)**
- **迭代器**：前向迭代器，遍历顺序与插入顺序**无关**

**结构示意：**

```
bucket[0] → [key1:val1] → [key7:val7]
bucket[1] → [key2:val2]
bucket[2] → (空)
bucket[3] → [key4:val4] → [key5:val5] → [key9:val9]
...
```

### 1.3 一句话总结

| 容器 | 一句话 |
|------|--------|
| `map` | 要**有序**、要范围查询、接受 O(log n) → 选 map |
| `unordered_map` | 只做**键值映射/计数**、追求 O(1) → 选 unordered_map |

---

## 第2章 基本用法

### 2.1 头文件与定义

```cpp
#include <map>
#include <unordered_map>
#include <string>

// 定义
map<int, string> mp;
unordered_map<string, int> ump;
```

### 2.2 插入元素

```cpp
// 方式1: [] 运算符（最常用，但注意：键不存在时会自动创建默认值）
mp[1] = "one";
ump["apple"] = 5;

// 方式2: insert（键已存在时不会覆盖）
mp.insert({2, "two"});
ump.insert({"banana", 3});

// 方式3: emplace（原地构造，效率更高）
mp.emplace(3, "three");
ump.emplace("orange", 7);
```

**[] 与 insert 的关键区别：**

```cpp
map<int, int> cnt;
cnt[1] = 10;      // 1→10
cnt[1] = 20;      // 1→20，覆盖

cnt.insert({1, 10});  // 1→20（已存在，不插入）
cnt.insert({1, 30});  // 1→20（不覆盖）
```

### 2.3 访问元素

```cpp
// 方式1: []（键不存在时会创建默认值——危险！）
int val = ump["unknown"];     // 会插入 {"unknown", 0}

// 方式2: at（键不存在时抛出异常，更安全）
int val = ump.at("unknown");  // 抛出 out_of_range

// 方式3: find（推荐——不修改容器）
auto it = ump.find("apple");
if (it != ump.end()) {
    // it->first 是键，it->second 是值
    cout << it->first << " " << it->second;
}
```

### 2.4 查找与删除

```cpp
// 查找是否存在
if (mp.count(1)) { ... }          // 返回 0 或 1
if (mp.find(1) != mp.end()) { ... }

// 删除
mp.erase(1);                      // 按键删除
mp.erase(mp.begin());             // 按迭代器删除
mp.erase(mp.begin(), mp.end());   // 范围删除

// 清空
mp.clear();

// 判空与大小
if (mp.empty()) { ... }
int sz = mp.size();
```

### 2.5 遍历

```cpp
// 范围 for（C++11 起）
for (const auto& [key, val] : mp) {
    cout << key << " -> " << val << endl;
}

// 迭代器遍历
for (auto it = mp.begin(); it != mp.end(); ++it) {
    cout << it->first << " -> " << it->second << endl;
}
```

### 2.6 完整示例

```cpp
#include <iostream>
#include <map>
#include <unordered_map>
#include <string>
using namespace std;

int main() {
    // unordered_map 统计词频
    unordered_map<string, int> freq;
    string words[] = {"apple", "banana", "apple", "orange", "banana", "apple"};

    for (const auto& w : words) {
        freq[w]++;          // 不存在的键自动初始化为 0，然后 +1
    }

    for (const auto& [word, cnt] : freq) {
        cout << word << ": " << cnt << endl;
    }

    // map 有序输出
    map<string, int> sorted_freq(freq.begin(), freq.end());
    for (const auto& [word, cnt] : sorted_freq) {
        cout << word << ": " << cnt << endl;
    }
    return 0;
}
```

---

## 第3章 进阶操作

### 3.1 自定义键类型

**map 要求键类型支持 `<` 比较：**

```cpp
struct Point {
    int x, y;
    bool operator<(const Point& other) const {  // const 必须加
        if (x != other.x) return x < other.x;
        return y < other.y;
    }
};

map<Point, int> pointMap;
```

**unordered_map 要求键类型提供哈希函数 + 相等比较：**

方式一：提供自定义哈希仿函数（推荐）

```cpp
struct Point {
    int x, y;
    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }
};

struct PointHash {
    size_t operator()(const Point& p) const {
        return hash<int>()(p.x) ^ (hash<int>()(p.y) << 1);
    }
};

unordered_map<Point, int, PointHash> pointMap;
```

方式二：特化 std::hash（全局生效，慎用）

```cpp
namespace std {
    template<>
    struct hash<Point> {
        size_t operator()(const Point& p) const {
            return hash<int>()(p.x) ^ (hash<int>()(p.y) << 1);
        }
    };
}
```

### 3.2 map 的 lower_bound / upper_bound

这是 `map` 区别于 `unordered_map` 的核心优势——范围查询：

```cpp
map<int, string> mp = {{1,"a"}, {3,"c"}, {5,"e"}, {7,"g"}, {9,"i"}};

// lower_bound(k) → 第一个键 >= k 的元素
auto it = mp.lower_bound(4);   // → {5, "e"}

// upper_bound(k) → 第一个键 > k 的元素
auto it = mp.upper_bound(5);   // → {7, "g"}

// 实战：查找闭区间 [L, R] 内的所有元素
int L = 3, R = 7;
auto lo = mp.lower_bound(L);
auto hi = mp.upper_bound(R);
for (auto it = lo; it != hi; ++it) {
    cout << it->first << " -> " << it->second << endl;
}
// 输出：3→c, 5→e, 7→g
```

### 3.3 unordered_map 的 rehash 与 bucket

```cpp
unordered_map<int, int> ump;

// 手动预留桶数，避免频繁 rehash（性能优化关键）
ump.reserve(1000);       // 预留 1000 个元素的空间
ump.max_load_factor(0.7); // 设置负载因子，默认 1.0

// 查看桶信息
cout << "bucket_count: " << ump.bucket_count() << endl;
cout << "load_factor: " << ump.load_factor() << endl;

// 遍历某个桶
size_t bucket_idx = ump.bucket(42);
for (auto it = ump.begin(bucket_idx); it != ump.end(bucket_idx); ++it) {
    cout << it->first << " " << it->second << endl;
}
```

**rehash 规则：** 当 `size() > bucket_count() * max_load_factor()` 时，自动 rehash 到更大的桶数组，所有元素重新插入。频繁 rehash 是性能杀手，数据量大时记得 `reserve`。

### 3.4 在遍历中安全删除

```cpp
// map 遍历中删除——必须用后置递增！
map<int, int> mp;
for (auto it = mp.begin(); it != mp.end(); ) {
    if (it->second == 0) {
        it = mp.erase(it);    // C++11 起 erase 返回下一个迭代器
    } else {
        ++it;
    }
}

// unordered_map 同理
for (auto it = ump.begin(); it != ump.end(); ) {
    if (it->second == 0) it = ump.erase(it);
    else ++it;
}
```

---

## 第4章 算法应用场景

### 4.1 计数类问题——unordered_map 的主场

**经典问题：统计数组中每个元素出现的次数**

```cpp
vector<int> nums = {1, 2, 2, 3, 1, 1, 4, 2};
unordered_map<int, int> cnt;
for (int x : nums) cnt[x]++;

// 找出现次数最多的元素
int maxFreq = 0, maxVal = 0;
for (const auto& [val, freq] : cnt) {
    if (freq > maxFreq) {
        maxFreq = freq;
        maxVal = val;
    }
}
```

**变种：统计字符串中字符频率**

```cpp
string s = "hello world";
unordered_map<char, int> freq;
for (char c : s) if (c != ' ') freq[c]++;
```

### 4.2 映射/字典类问题

**经典问题：两数之和（LeetCode 1）**

```cpp
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;  // value → index
    for (int i = 0; i < nums.size(); i++) {
        int need = target - nums[i];
        if (mp.count(need)) {
            return {mp[need], i};
        }
        mp[nums[i]] = i;
    }
    return {};
}
```

**建立映射关系：**

```cpp
// 罗马数字转整数
unordered_map<char, int> roman = {
    {'I', 1}, {'V', 5}, {'X', 10},
    {'L', 50}, {'C', 100}, {'D', 500}, {'M', 1000}
};
```

### 4.3 去重与判重

```cpp
// 判断链表中是否有环（哈希法）
bool hasCycle(ListNode* head) {
    unordered_set<ListNode*> visited;
    while (head) {
        if (visited.count(head)) return true;
        visited.insert(head);
        head = head->next;
    }
    return false;
}

// 判断两个数组是否有交集
vector<int> intersection(vector<int>& a, vector<int>& b) {
    unordered_set<int> sa(a.begin(), a.end());
    vector<int> res;
    for (int x : b) {
        if (sa.count(x)) {
            res.push_back(x);
            sa.erase(x);  // 避免重复添加
        }
    }
    return res;
}
```

### 4.4 区间/有序场景——map 的专属战场

**问题：区间调度 / 日程管理**

```cpp
// 维护一系列不重叠的区间
map<int, int> intervals;  // start → end

// 插入区间 [L, R]
void addInterval(int L, int R) {
    auto it = intervals.lower_bound(L);
    // 检查与前一个区间是否重叠
    if (it != intervals.begin()) {
        auto prev = it;
        --prev;
        if (prev->second >= L) it = prev;
    }
    // 合并重叠区间
    while (it != intervals.end() && it->first <= R) {
        L = min(L, it->first);
        R = max(R, it->second);
        it = intervals.erase(it);
    }
    intervals[L] = R;
}
```

**问题：在线股票价格的时间轴查询**

```cpp
map<int, int> stockPrices;  // timestamp → price

void update(int timestamp, int price) {
    stockPrices[timestamp] = price;
}

int getPriceAt(int timestamp) {
    auto it = stockPrices.upper_bound(timestamp);  // 第一个 > timestamp 的
    if (it == stockPrices.begin()) return -1;      // 没有记录
    --it;                                           // 最后一个 <= timestamp 的
    return it->second;
}
```

### 4.5 综合案例

**案例1：LRU 缓存（LeetCode 146）**

map 用于维护键到链表节点的映射，实现 O(1) 查找 + 淘汰：

```cpp
// 思路：双向链表 + unordered_map
// unordered_map<int, ListNode*> 保存 key → 链表节点指针
// 访问时从 map 中 O(1) 定位节点，移动到链表头部
// 淘汰时删除链表尾部，同时从 map 中擦除
```

**案例2：单词接龙（LeetCode 127）**

```cpp
// BFS 层序遍历，unordered_set<string> 存已访问单词
// unordered_map<string, int> 存单词到步数的映射
// 用哈希实现 O(1) 查重，避免 TLE
```

**案例3：Top K 高频元素（LeetCode 347）**

组合技：`unordered_map` 统计频率 → `priority_queue` 堆排 TopK

```cpp
vector<int> topKFrequent(vector<int>& nums, int k) {
    unordered_map<int, int> freq;
    for (int x : nums) freq[x]++;

    // 小根堆，按频率排序
    using pii = pair<int,int>;
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    for (const auto& [val, cnt] : freq) {
        pq.push({cnt, val});
        if (pq.size() > k) pq.pop();
    }

    vector<int> res;
    while (!pq.empty()) {
        res.push_back(pq.top().second);
        pq.pop();
    }
    return res;
}
```

---

## 第5章 选型决策

### 5.1 决策树

```
需要键值对映射？
├── 需要有序 / 范围查询 / lower_bound？
│   └── → map
├── 只需要 O(1) 快速查找？
│   ├── 键类型简单（int/string/指针）？
│   │   └── → unordered_map
│   └── 键类型复杂（自定义结构体）？
│       └── 愿意写哈希函数吗？
│           ├── 是 → unordered_map + 自定义哈希
│           └── 否 → map（只需要写 operator<）
└── 数据量小于 100？
    └── 两者都可以，map 更省事
```

### 5.2 时间复杂度对比

| 操作 | map | unordered_map |
|------|-----|---------------|
| 插入 | O(log n) | O(1) 平均，O(n) 最坏 |
| 删除 | O(log n) | O(1) 平均，O(n) 最坏 |
| 查找 | O(log n) | O(1) 平均，O(n) 最坏 |
| lower_bound | O(log n) | ❌ 不支持 |
| 遍历 | O(n) 有序 | O(n) 无序 |
| 空间 | 约 3n 指针 | 约 n + bucket_count |

### 5.3 竞赛中容易被忽略的坑

**坑1：unordered_map 被卡哈希——最常被忽略的 TLE 原因**

某些 OJ 会构造哈希冲突数据，让 unordered_map 退化到 O(n)。
- 应对：部分 OJ 可使用 `unordered_map` 的自定义哈希来规避
- 终极方案：在不确定的竞赛中，**能用 map 就用 map**，O(log n) 在 1e5 级别数据量下完全够用

```cpp
// 防卡哈希的自定义哈希（用于竞赛环境）
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t FIXED_RANDOM = chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + FIXED_RANDOM);
    }
};

unordered_map<int, int, custom_hash> safe_ump;
```

**坑2：[] 会修改容器**

```cpp
if (mp[42] == 0) { ... }     // 如果 42 不存在，会插入 {42, 0}！
// 正确写法：
if (mp.count(42) && mp[42] == 0) { ... }
// 或：
auto it = mp.find(42);
if (it != mp.end() && it->second == 0) { ... }
```

**坑3：map 的迭代器失效**

- map（红黑树）：插入一般不失效，删除只会使被删迭代器失效
- unordered_map（哈希表）：rehash 时**所有迭代器失效**，插入大量元素后不要再持有旧的迭代器

**坑4：自定义类型做键时忘加 const**

```cpp
// map 的 operator< 必须加 const
bool operator<(const Point& other) const { ... }

// unordered_map 的 operator== 也必须加 const
bool operator==(const Point& other) const { ... }
```

### 5.4 内存对比

- `map`：每个节点存 3 个指针（左、右、父）+ 颜色位，约 40 字节/元素
- `unordered_map`：每个节点存 1 个 next 指针 + 桶数组，约 32 字节/元素 + 桶数组
- 数据量达 1e6 时，map 约 40MB，unordered_map 约 32MB + 桶数组

---

## 附录：速查表

### API 速查

| 操作 | map | unordered_map |
|------|-----|---------------|
| 插入（覆盖） | `mp[k] = v` | `ump[k] = v` |
| 插入（不覆盖） | `mp.insert({k, v})` | `ump.insert({k, v})` |
| 原地构造 | `mp.emplace(k, v)` | `ump.emplace(k, v)` |
| 访问（安全） | `mp.at(k)` | `ump.at(k)` |
| 查找 | `mp.find(k)` | `ump.find(k)` |
| 判存在 | `mp.count(k)` | `ump.count(k)` |
| 删除 | `mp.erase(k)` | `ump.erase(k)` |
| 清空 | `mp.clear()` | `ump.clear()` |
| 大小 | `mp.size()` | `ump.size()` |
| 判空 | `mp.empty()` | `ump.empty()` |
| 下界 | `mp.lower_bound(k)` | ❌ |
| 上界 | `mp.upper_bound(k)` | ❌ |
| 预留空间 | ❌（不需要） | `ump.reserve(n)` |

### 典型场景推荐

| 场景 | 推荐容器 | 原因 |
|------|----------|------|
| 统计词频/频率 | `unordered_map` | 只需 O(1) 累加 |
| 两数之和 | `unordered_map` | 只需要一次遍历 |
| 区间查询/调度 | `map` | lower_bound 做范围查找 |
| 有序输出 | `map` | 自动排序 |
| 自定义结构体键 | `map` | 只需写 operator<，省事 |
| 数据量 1e5+ 且不确定 | `map` | 防哈希冲突 TLE |
| LRU 缓存 | 两者结合 | map 存映射，链表存顺序 |

---

> 写于 2026-08-22 | 面向算法竞赛与工程实践

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
