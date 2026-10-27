# DFS/BFS 算法模板与详解（码蹄杯国赛版）

> 2026-07-29 · 适用于 ACM 赛制

---

## 目录

1. [DFS 图遍历（基础）](#1-dfs-图遍历基础)
2. [DFS 网格图遍历（连通块）](#2-dfs-网格图遍历连通块)
3. [BFS 图遍历（无权图最短路）](#3-bfs-图遍历无权图最短路)
4. [BFS 网格图遍历（多源BFS）](#4-bfs-网格图遍历多源bfs)
5. [回溯框架（DFS + 状态还原）](#5-回溯框架dfs--状态还原)
6. [DFS vs BFS 对比](#6-dfs-vs-bfs-对比)
7. [完整调用示例（ACM赛制）](#7-完整调用示例acm赛制)
8. [网格图题通用思路（灵茶山艾府题单整理）](#8-网格图题通用思路灵茶山艾府题单整理)
9. [常见坑与调试指南](#9-常见坑与调试指南)
10. [总结：快速决策指南](#10-总结快速决策指南)

---

## 1. DFS 图遍历（基础）

### 用途

遍历连通分量、检测环、回溯搜索。

### 模板

```cpp
void dfs(int u, const vector<vector<int>>& g, vector<bool>& vis) {
    vis[u] = true;                     // ① 标记已访问
    for (int v : g[u]) {               // ② 遍历所有邻居
        if (!vis[v]) {                 // ③ 没去过才去
            dfs(v, g, vis);            // ④ 递归深入
        }
    }
}
```

### 逐行逻辑详解

| 代码 | 在干什么 |
|------|---------|
| `vis[u] = true` | 进来先标记，防止重复访问和死循环 |
| `for (int v : g[u])` | 遍历 u 的所有邻居节点 |
| `if (!vis[v])` | 只有没访问过的邻居才需要递归进去 |
| `dfs(v, g, vis)` | 递归深入，一路走到黑 |

### 连通分量计数

```cpp
int cnt = 0;
for (int i = 0; i < n; i++) {
    if (!vis[i]) {
        cnt++;          // 发现新连通块
        dfs(i, g, vis); // 把整个连通块全部标记
    }
}
```

### 有向图判环（三色标记）

```cpp
// 0 = 未访问, 1 = 在栈中, 2 = 已结束
vector<int> state(n, 0);

function<bool(int)> hasCycle = [&](int u) -> bool {
    state[u] = 1;                       // 入栈
    for (int v : g[u]) {
        if (state[v] == 1) return true; // 遇到还在栈中的 → 有环
        if (state[v] == 0 && hasCycle(v)) return true;
    }
    state[u] = 2;                       // 出栈，标记结束
    return false;
};
```

---

## 2. DFS 网格图遍历（连通块）

### 解决什么问题

网格图中统计连通块数量、最大面积、边界可达性等。

### 模板

```cpp
// 方向数组：右、左、下、上
const int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

void dfs(int x, int y, vector<vector<char>>& grid, vector<vector<bool>>& vis) {
    int m = grid.size(), n = grid[0].size();
    vis[x][y] = true;                    // 标记已访问

    for (int k = 0; k < 4; k++) {
        int nx = x + dirs[k][0];
        int ny = y + dirs[k][1];

        // 边界检查 + 目标值检查 + 已访问检查
        if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
        if (grid[nx][ny] != '1') continue;
        if (vis[nx][ny]) continue;

        dfs(nx, ny, grid, vis);
    }
}
```

### 逐行逻辑详解

| 代码 | 在干什么 |
|------|---------|
| `dirs[4][2]` | 方向数组，定义四个移动方向（右左下上） |
| `vis[x][y] = true` | 标记当前格子已访问 |
| `for (int k = 0; k < 4; k++)` | 遍历四个方向 |
| `nx = x + dirs[k][0]` | 计算邻居坐标 |
| `nx < 0 || nx >= m` | 越界检查——超出网格边界就跳过 |
| `grid[nx][ny] != '1'` | 不是目标值（陆地/可通行区域）就跳过 |
| `vis[nx][ny]` | 已经去过就不用再去了 |

### 优化技巧：原地标记（不用 vis 数组）

```cpp
void dfs(int x, int y, vector<vector<char>>& grid) {
    int m = grid.size(), n = grid[0].size();
    if (x < 0 || x >= m || y < 0 || y >= n) return;
    if (grid[x][y] != '1') return;   // 不是陆地，或者已经被淹了

    grid[x][y] = '0';                // 直接淹掉，等价于标记已访问

    for (int k = 0; k < 4; k++)
        dfs(x + dirs[k][0], y + dirs[k][1], grid);
}
```

**优点：** 省掉一个 vis 数组，少写一半代码。
**注意：** 会修改原数组，如果题目要求不能修改原数据就不能用。

### 网格图 DFS 的典型应用

| 应用 | 做法 | 代表题 |
|------|------|--------|
| 连通块计数 | 遍历网格，遇到未访问陆地就DFS淹掉，计数+1 | 200·岛屿数量 |
| 最大连通块面积 | DFS返回连通块大小，取max | 695·岛屿的最大面积 |
| 边界可达性 | 从边界出发DFS，标记所有能到达的格子 | 130·被围绕的区域 |
| 封闭岛屿计数 | DFS时判断是否接触边界，不接触才算 | 1254·统计封闭岛屿的数目 |
| 飞地计数 | 去掉边界可达的，剩下的就是 | 1020·飞地的数量 |
| 多源边界DFS | 从多个边界点同时开始DFS | 417·太平洋大西洋水流问题 |

---

## 3. BFS 图遍历（无权图最短路）

### 用途

求无权图的最短路径长度、层次遍历、多源搜索。

### 模板

```cpp
void bfs(int s, const vector<vector<int>>& g, vector<int>& dist) {
    queue<int> q;
    dist[s] = 0;              // 起点到自己的距离是 0
    q.push(s);

    while (!q.empty()) {
        int u = q.front(); q.pop();

        for (int v : g[u]) {
            if (dist[v] == -1) {         // 第一次访问 = 最短距离
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
}
```

### 逐行逻辑详解

| 代码 | 在干什么 |
|------|---------|
| `queue<int> q` | 创建队列，BFS 的"待办清单" |
| `dist[s] = 0` | 起点距离自己是 0 |
| `q.push(s)` | 起点入队 |
| `while (!q.empty())` | 只要还有没处理的节点 |
| `u = q.front(); q.pop()` | 从队首取出一个节点 |
| `for (int v : g[u])` | 遍历 u 的所有邻居 |
| `dist[v] == -1` | 第一次遇到 v（dist 初始全 -1） |
| `dist[v] = dist[u] + 1` | 距离 = 上一步 + 1 |
| `q.push(v)` | 入队，之后从 v 继续扩展 |

### 为什么 BFS 第一次访问就是最短距离

BFS 按层扩展：

```
         s  (层 0)
        / \
       a   b (层 1)
      / \   \
     c   d   e (层 2)
```

先访问 s，再访问所有距离为 1 的点，再访问所有距离为 2 的点……第一次访问到某个节点时，一定是从 s 出发的最短路径。

### 分层 BFS（按层计数）

```cpp
int bfs_level(int s, int target, const vector<vector<int>>& g) {
    int n = g.size();
    vector<int> dist(n, -1);
    queue<int> q;
    dist[s] = 0;
    q.push(s);

    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == target) return dist[u];  // 找到目标

        for (int v : g[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return -1;  // 不可达
}
```

---

## 4. BFS 网格图遍历（多源BFS）

### 用途

网格图中求最短路径步数、多点同时扩散。

### 模板

```cpp
const int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

int bfs_grid(vector<vector<int>>& grid, int sx, int sy) {
    int m = grid.size(), n = grid[0].size();
    vector<vector<int>> dist(m, vector<int>(n, -1));
    queue<pair<int, int>> q;

    dist[sx][sy] = 0;
    q.push({sx, sy});

    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();

        for (int k = 0; k < 4; k++) {
            int nx = x + dirs[k][0];
            int ny = y + dirs[k][1];

            if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
            if (dist[nx][ny] != -1) continue;   // 已经访问过
            if (grid[nx][ny] == 0) continue;     // 障碍物/不可通行

            dist[nx][ny] = dist[x][y] + 1;
            q.push({nx, ny});
        }
    }
    return -1;  // 不可达
}
```

### 多源 BFS：多个起点同时入队

```cpp
int bfs_multi_source(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    vector<vector<int>> dist(m, vector<int>(n, -1));
    queue<pair<int, int>> q;

    // 所有起点同时入队
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (/* 起点条件 */) {
                dist[i][j] = 0;
                q.push({i, j});
            }
        }
    }

    int ans = 0;
    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        ans = max(ans, dist[x][y]);  // 记录最远距离

        for (int k = 0; k < 4; k++) {
            int nx = x + dirs[k][0], ny = y + dirs[k][1];
            if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
            if (dist[nx][ny] != -1) continue;

            dist[nx][ny] = dist[x][y] + 1;
            q.push({nx, ny});
        }
    }
    return ans;
}
```

**典型应用：**
- 994·腐烂的橘子：所有烂橘子同时入队，逐层扩散
- 542·01矩阵：从所有 0 出发向外扩散，计算每个格子到最近 0 的距离
- 1162·地图分析：从所有陆地出发，找离陆地最远的海洋

### BFS 网格图 vs DFS 网格图

| | DFS 连通块 | BFS 最短路 |
|--|----------|----------|
| 数据结构 | 递归栈 | 队列 |
| 标记时机 | 进入时标记 | 入队时标记 |
| 距离 | 不保证最短 | 第一次到就是最短 |
| 适用场景 | 连通块计数、可达性判断 | 最短路径、最少步数 |
| 多源 | 逐个起点DFS | 多起点同时入队 |

---

## 5. 回溯框架（DFS + 状态还原）

### 解决什么问题

不是找"有没有连通块"，而是找"一条符合条件的具体路径"——比如 79·单词搜索在网格里找单词。

### 核心区别

| | 普通DFS | 回溯 |
|--|--------|------|
| visited | 标记了就不改 | 递归完要**撤销标记** |
| 目标 | 遍历全部 | 找一条路 |
| 例子 | 200·岛屿数量 | 79·单词搜索、46·全排列 |

### 回溯框架

```cpp
// 回溯通用框架
void backtrack(路径, 选择列表) {
    if (满足结束条件) {
        记录结果;
        return;
    }
    for (选择 : 选择列表) {
        if (选择不合法) continue;  // 剪枝
        做选择;                     // 标记
        backtrack(路径, 选择列表);  // 递归
        撤销选择;                   // 恢复标记
    }
}
```

### 79·单词搜索（网格图回溯）

```cpp
class Solution {
public:
    const int dirs[4][2] = {{0,1},{0,-1},{1,0},{-1,0}};
    int m, n;

    bool exist(vector<vector<char>>& board, string word) {
        m = board.size(), n = board[0].size();

        // 优化：统计字符频率，图中字符不够直接返回 false
        vector<int> cnt(128), wordCnt(128);
        for (auto& row : board)
            for (char c : row) cnt[c]++;
        for (char c : word)
            if (++wordCnt[c] > cnt[c]) return false;

        // 优化：从出现次数少的那头开始搜（剪枝更早）
        if (cnt[word[0]] > cnt[word.back()])
            reverse(word.begin(), word.end());

        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (dfs(i, j, 0, board, word))
                    return true;
        return false;
    }

    bool dfs(int x, int y, int idx, vector<vector<char>>& board, string& word) {
        if (board[x][y] != word[idx]) return false;
        if (idx == word.size() - 1) return true;  // 最后一个字符匹配成功

        board[x][y] = '\0';  // 标记已使用（原地修改，省vis数组）
        for (int k = 0; k < 4; k++) {
            int nx = x + dirs[k][0], ny = y + dirs[k][1];
            if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
            if (dfs(nx, ny, idx + 1, board, word))
                return true;
        }
        board[x][y] = word[idx];  // 撤销标记（恢复现场）
        return false;
    }
};
```

### 回溯的优化技巧（灵茶山艾府常用）

| 优化 | 效果 | 适用场景 |
|------|------|---------|
| 字符频率预检 | 提前排除不可能的情况 | 79·单词搜索 |
| 从低频字符端开始搜 | 减少分支，更快剪枝 | 搜索起始端有多种选择时 |
| 原地修改（不用vis数组） | 省空间、省代码 | 可修改原数据的题 |
| 先排序再回溯 | 相同元素相邻，方便去重 | 全排列 II、子集 II |

---

## 6. DFS vs BFS 对比

### 一句话对比

| | DFS | BFS |
|--|-----|-----|
| 数据结构 | 栈（递归就是系统栈） | 队列 |
| 性格 | 一头扎到底，走不通再回头 | 一圈一圈往外扩 |
| 距离 | 不保证最短 | 第一次到就是最短 |
| 空间 | 最坏 O(n) 递归栈 | 最坏 O(n) 队列 |
| 适用场景 | 连通块、回溯、判环 | 无权图最短路、层次遍历 |

### 什么场景选什么

| 需求 | 选哪个 |
|------|--------|
| 统计连通块数量 | DFS 或 BFS 都行，DFS 代码更短 |
| 求最短路径长度 | **BFS**（无权图）或 Dijkstra（带权图） |
| 找一条具体路径 | DFS（回溯，需要状态还原） |
| 判断是否有环 | DFS 三色标记更直观 |
| 按层输出 | BFS |
| 判断是否可达 | DFS 或 BFS 都行 |
| 多源扩散 | **BFS**（多源BFS） |

---

## 7. 完整调用示例（ACM赛制）

### 例：岛屿数量（200）

```cpp
#include <bits/stdc++.h>
using namespace std;

const int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

void dfs(int x, int y, vector<vector<char>>& grid) {
    int m = grid.size(), n = grid[0].size();
    if (x < 0 || x >= m || y < 0 || y >= n) return;
    if (grid[x][y] != '1') return;

    grid[x][y] = '0';  // 淹掉

    for (int k = 0; k < 4; k++)
        dfs(x + dirs[k][0], y + dirs[k][1], grid);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m, n;
    cin >> m >> n;
    vector<vector<char>> grid(m, vector<char>(n));

    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            cin >> grid[i][j];

    int cnt = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == '1') {
                cnt++;
                dfs(i, j, grid);
            }
        }
    }

    cout << cnt << endl;
    return 0;
}
```

### 例：BFS 最短路（网格图）

```cpp
#include <bits/stdc++.h>
using namespace std;

const int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m, n, sx, sy, tx, ty;
    cin >> m >> n;
    vector<vector<int>> grid(m, vector<int>(n));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            cin >> grid[i][j];
    cin >> sx >> sy >> tx >> ty;

    vector<vector<int>> dist(m, vector<int>(n, -1));
    queue<pair<int, int>> q;

    dist[sx][sy] = 0;
    q.push({sx, sy});

    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        if (x == tx && y == ty) {
            cout << dist[x][y] << endl;
            return 0;
        }
        for (int k = 0; k < 4; k++) {
            int nx = x + dirs[k][0], ny = y + dirs[k][1];
            if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
            if (dist[nx][ny] != -1) continue;
            if (grid[nx][ny] == 0) continue;  // 障碍物
            dist[nx][ny] = dist[x][y] + 1;
            q.push({nx, ny});
        }
    }

    cout << -1 << endl;  // 不可达
    return 0;
}
```

---

## 8. 网格图题通用思路（灵茶山艾府题单整理）

> 灵茶山艾府（endlesscheng）的 LeetCode 网格图题单：https://leetcode.cn/circle/discuss/aFQxSI/

### 8.1 网格图题目分类

根据灵神的题单，网格图题按使用算法分为五类：

| 类别 | 核心算法 | 典型题 |
|------|---------|--------|
| **网格图 DFS** | 方向数组 + 递归标记 | 200、695、130、1254、1020、417 |
| **网格图 BFS** | 队列 + 距离数组 | 1926、1091、542、994、934 |
| **网格图 0-1 BFS** | 双端队列（0加队首、1加队尾） | 3286、2290、1368 |
| **网格图 Dijkstra** | 堆优化最短路 | 1631、778、329 |
| **综合应用** | DFS/BFS + 状压/DP | 864、1263、2577 |

### 8.2 网格图 DFS 通用模板（灵神风格）

```cpp
// 灵神网格图 DFS 标准模板
class Solution {
    const int dirs[4][2] = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    void dfs(int x, int y, vector<vector<int>>& grid, vector<vector<bool>>& vis) {
        vis[x][y] = true;
        for (auto& d : dirs) {
            int nx = x + d[0], ny = y + d[1];
            if (nx < 0 || nx >= grid.size() || ny < 0 || ny >= grid[0].size())
                continue;
            if (vis[nx][ny]) continue;
            if (grid[nx][ny] != 1) continue;  // 条件根据题目调整
            dfs(nx, ny, grid, vis);
        }
    }
};
```

**关键点：** 四个 if 写进循环 = 一个 for 搞定四个方向，比写四个单独的 dfs 调用更简洁不易错。

### 8.3 网格图 BFS 通用模板（灵神风格）

```cpp
// 灵神网格图 BFS 标准模板
int bfs(vector<vector<int>>& grid, int sx, int sy) {
    int m = grid.size(), n = grid[0].size();
    vector<vector<int>> dis(m, vector<int>(n, -1));
    queue<pair<int, int>> q;
    dis[sx][sy] = 0;
    q.push({sx, sy});

    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        for (auto& d : dirs) {
            int nx = x + d[0], ny = y + d[1];
            if (nx < 0 || nx >= m || ny < 0 || ny >= n) continue;
            if (dis[nx][ny] != -1) continue;  // 已访问
            // 根据题目补充条件...
            dis[nx][ny] = dis[x][y] + 1;
            q.push({nx, ny});
        }
    }
    return -1;
}
```

### 8.4 0-1 BFS（边权只有 0 和 1 时）

当网格中的移动代价只有 0 和 1 时，可以用双端队列代替堆，从 O(mn log(mn)) 降到 O(mn)。

```cpp
// 0-1 BFS：边权 0 加队首，边权 1 加队尾
deque<pair<int, int>> dq;
dq.push_front({sx, sy});
dis[sx][sy] = 0;

while (!dq.empty()) {
    auto [x, y] = dq.front(); dq.pop_front();
    for (int k = 0; k < 4; k++) {
        int nx = x + dirs[k][0], ny = y + dirs[k][1];
        if (超出边界) continue;

        int cost = (grid[nx][ny] == 1) ? 1 : 0;  // 根据题目定
        if (dis[x][y] + cost < dis[nx][ny]) {
            dis[nx][ny] = dis[x][y] + cost;
            if (cost == 0) dq.push_front({nx, ny});  // 0 边权加队首
            else dq.push_back({nx, ny});              // 1 边权加队尾
        }
    }
}
```

**典型题：** 3286·穿越网格图的安全路径、2290·到达角落需要移除障碍物的最小数目

### 8.5 网格图题解题思路总结（灵神体系）

**第一步：判断用什么算法**

```
题目是网格图
  ├─ 问"连通块数量/最大面积/是否可达"
  │     → DFS（代码最短）
  ├─ 问"最短路径/最少步数/最近距离"
  │     → BFS（无权图）或 0-1 BFS（边权0/1）
  └─ 问"最小化路径最大值/带权最短路"
        → Dijkstra / 二分+BFS
```

**第二步：三种常见变形**

| 变形 | 解法 | 例子 |
|------|------|------|
| 从边界出发向内搜索 | 边界DFS，标记所有能到的 | 130、417 |
| 从多个点同时出发 | 多源BFS，所有起点同时入队 | 994、542、1162 |
| 正向做不了，逆向做 | 从最终状态开始反向搜索 | 803·打砖块 |

**第三步：灵神的两个好用优化**
1. 原地修改代替 vis 数组（如果题目允许修改原数组）
2. 方向数组用循环，不要写四个单独的递归调用

### 8.6 灵神题单中码蹄杯国赛级别的重点题

| 题号 | 题名 | 类型 | 码蹄杯参考价值 |
|------|------|------|--------------|
| 200 | 岛屿数量 | DFS连通块 | 🔴 模板级，必掌握 |
| 695 | 岛屿的最大面积 | DFS+计数 | 🔴 200的变种 |
| 130 | 被围绕的区域 | 边界DFS | 🟡 常考思路 |
| 1020 | 飞地的数量 | 边界DFS | 🟡 130的变种 |
| 1254 | 统计封闭岛屿 | 边界DFS+判断 | 🟡 进阶 |
| 1926 | 迷宫中离入口最近的出口 | BFS最短路 | 🔴 BFS模板 |
| 994 | 腐烂的橘子 | 多源BFS | 🔴 必练 |
| 542 | 01矩阵 | 多源BFS | 🟡 值得做 |
| 1091 | 二进制矩阵中的最短路径 | BFS | 🟡 带障碍物 |
| 934 | 最短的桥 | 双DFS/BFS | 🟡 综合 |

---

## 9. 常见坑与调试指南

### 坑①：方向数组写错

```cpp
// 错误
const int dirs[4][2] = {{0, 1}, {1, 0}, {0, -1}, {-1, 0}};
// 顺序无所谓，但一定要四对，不能漏方向

// 常见错误：写成 {0, 1}, {1, 0} 只有两个方向
```

### 坑②：BFS 标记时机错了

```cpp
// 错误：出队时才标记
int u = q.front(); q.pop();
vis[u] = true;  // 太晚了！同一个节点可能被多次入队

// 正确：入队时就标记
vis[v] = true;
q.push(v);
```

**记住：** BFS 在**入队时标记**，不是在出队时标记。否则会重复入队。

### 坑③：DFS 递归爆栈

网格图 m×n 最大 300×300 = 90000 个格子，递归深度可能到 90000 层，在部分评测系统上会栈溢出。

**解决方案：**
- 小数据（n ≤ 200）用递归没问题
- 大数据用显式栈（stack）模拟 DFS，或用 BFS 代替

### 坑④：回溯忘记恢复现场

```cpp
// 错误
board[x][y] = '\0';  // 标记
dfs(...);             // 递归
// 忘记恢复！下一次从别的起点出发时 board 已经被改了

// 正确
board[x][y] = '\0';
dfs(...);
board[x][y] = word[idx];  // 恢复现场
```

**区分：** 连通块 DFS 不需要恢复（标记了就不用再访问了），回溯必须恢复。

### 坑⑤：网格边界判断顺序

```cpp
// 推荐写法：先判断越界，再判断其他条件
if (x < 0 || x >= m || y < 0 || y >= n) continue;
if (grid[x][y] != 1) continue;
if (vis[x][y]) continue;

// 不要写成
if (grid[x][y] == 1 && !vis[x][y] && x >= 0 && ...) // 先访问 grid 可能越界
```

### 调试技巧

```cpp
// 打印网格状态（用于调试DFS/BFS过程）
void printGrid(vector<vector<char>>& grid) {
    for (auto& row : grid) {
        for (char c : row) cout << c << " ";
        cout << endl;
    }
    cout << "---" << endl;
}

// 打印距离矩阵（BFS调试）
void printDist(vector<vector<int>>& dist) {
    for (auto& row : dist) {
        for (int d : row) {
            if (d == -1) cout << ". ";
            else cout << d << " ";
        }
        cout << endl;
    }
}
```

---

## 10. 总结：快速决策指南

### 30秒判断流程

```
题目是"图"还是"网格"？
  │
  ├─ 图（邻接表/邻接矩阵）
  │   ├─ 问最短路径 → 无权？→ BFS | 带权？→ Dijkstra
  │   ├─ 问连通分量 → DFS 或并查集
  │   └─ 问有没有环 → DFS 三色标记
  │
  └─ 网格图（二维矩阵）
      ├─ 问连通块数量/面积 → DFS 连通块模板
      ├─ 问最短路径/最少步数 → BFS 最短路模板
      ├─ 问"边界可达" → 边界DFS
      └─ 问"找一条具体路径" → DFS+回溯（要恢复现场）
```

### 优先级梯队（码蹄杯国赛）

| 优先级 | 内容 | 要求 | 练手题 |
|--------|------|------|--------|
| 🔴 **必会** | DFS连通块（网格图） | 闭眼能写 | 200, 695 |
| 🔴 **必会** | BFS最短路（网格图） | 闭眼能写 | 1926, 994 |
| 🟡 **重点** | 多源BFS | 理解多起点同时入队 | 994, 542 |
| 🟡 **重点** | 边界DFS | 理解从边界向内搜 | 130, 1020 |
| 🟢 **了解** | 回溯框架 | 理解标记→递归→撤销 | 46, 79 |
| 🟢 **了解** | 0-1 BFS | 理解双端队列优化 | 3286 |
| 🟢 **了解** | DFS判环（三色标记） | 理解三种状态 | 207（拓扑也行） |

### 一句话口诀

> **连通块用DFS淹，最短路径BFS先；**
> **多源一起入队列，边界向内搜一遍；**
> **回溯记得要还原，方向数组走四边。**

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与转发。