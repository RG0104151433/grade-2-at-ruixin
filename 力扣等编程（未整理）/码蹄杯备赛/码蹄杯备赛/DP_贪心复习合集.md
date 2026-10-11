# DP 与贪心 复习合集

> 来源：RG0104151433/RG-LeetCode-study
> 整理时间：2026-07-29
> 用途：码蹄杯国赛前快速回顾

---

# 第一部分：动态规划（18题）

---

## 一、一维 DP（7题）

### 1. 122 买卖股票的最佳时机 II

**类型：** 状态机 DP

**核心思路：**
- 每天有两种状态：手中有股票（dp1）和手中无股票（dp0）
- `dp0 = max(dp0, dp1 + prices[i])` —— 昨天没买 / 今天卖出
- `dp1 = max(dp1, dp0 - prices[i])` —— 昨天持有 / 今天买入
- 滚动数组优化，只维护两个变量

**代码骨架：**
```cpp
int maxProfit(vector<int>& prices) {
    int dp0 = 0, dp1 = -prices[0];
    for (int i = 1; i < prices.size(); i++) {
        int newdp0 = max(dp0, dp1 + prices[i]);
        int newdp1 = max(dp1, dp0 - prices[i]);
        dp0 = newdp0; dp1 = newdp1;
    }
    return dp0;
}
```

---

### 2. 322 零钱兑换

**类型：** 完全背包

**核心思路：**
- `dp[i]` 表示凑出金额 i 所需的最少硬币数
- 初始化 `dp[i] = amount + 1`（一个大数），`dp[0] = 0`
- `dp[i] = min(dp[i], dp[i - coin] + 1)`
- 完全背包，硬币可以重复使用，所以 coin 放在内层循环

**代码骨架：**
```cpp
int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins)
        for (int i = coin; i <= amount; i++)
            dp[i] = min(dp[i], dp[i - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

---

### 3. 198 打家劫舍

**类型：** 线性 DP

**核心思路：**
- `dp[i]` 表示前 i 间房能偷到的最大金额
- 选当前房：`dp[i-2] + nums[i]`
- 不选当前房：`dp[i-1]`
- `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`
- 可滚动为两个变量

**代码骨架：**
```cpp
int rob(vector<int>& nums) {
    int prev = 0, curr = 0;
    for (int x : nums) {
        int temp = curr;
        curr = max(curr, prev + x);
        prev = temp;
    }
    return curr;
}
```

---

### 4. 139 单词拆分

**类型：** 字符串 DP

**核心思路：**
- `dp[i]` 表示 s[0..i] 是否可被拆分为字典中的单词
- 对每个位置 i，检查所有单词 word：如果 `dp[i - len(word)] == true` 且 `s[i-len+1..i] == word`，则 `dp[i] = true`
- 剪枝：先记录每个单词的长度

**代码骨架：**
```cpp
bool wordBreak(string s, vector<string>& wordDict) {
    int n = s.size();
    vector<bool> dp(n + 1, false);
    dp[0] = true;
    for (int i = 1; i <= n; i++) {
        for (string& w : wordDict) {
            int len = w.size();
            if (i >= len && dp[i - len] && s.substr(i - len, len) == w) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
}
```

---

### 5. 279 完全平方数

**类型：** 完全背包 / 数学

**核心思路：**
- `dp[i]` 表示 i 最少由几个完全平方数组成
- 完全平方数自己是 1 步
- `dp[i] = min(dp[i], dp[i - j*j] + 1)`，遍历所有 j 使得 j*j ≤ i
- 注意浮点数精度问题，用 `j*j` 而不是 `sqrt`

**代码骨架：**
```cpp
int numSquares(int n) {
    vector<int> dp(n + 1, n);
    dp[0] = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j * j <= i; j++) {
            dp[i] = min(dp[i], dp[i - j * j] + 1);
        }
    }
    return dp[n];
}
```

---

### 6. 377 组合总和 IV

**类型：** 排列 DP（外层 target 内层 nums）

**核心思路：**
- `dp[i]` 表示凑出 i 的排列数（顺序不同算不同）
- 外层遍历 target，内层遍历 nums：`dp[i] += dp[i - num]`
- 注意：这是**排列数**（顺序不同算不同），所以外层 target 内层 nums
- 如果是组合数（顺序不同不算不同），则是外层 nums 内层 target
- 用 `long long` 防溢出

**代码骨架：**
```cpp
int combinationSum4(vector<int>& nums, int target) {
    vector<unsigned long long> dp(target + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= target; i++) {
        for (int num : nums) {
            if (i >= num) dp[i] += dp[i - num];
        }
    }
    return dp[target];
}
```

---

### 7. 2260 相同牌之间的最小间距

**类型：** 哈希 + 递推（类 DP）

**核心思路：**
- 记录每个数字最近一次出现的位置
- 遍历时如果当前数字出现过，计算间距 = 当前位置 - 上次位置 + 1，更新最小值
- 更新该数字的最新位置

**代码骨架：**
```cpp
int minimumCardPickup(vector<int>& cards) {
    int n = cards.size(), ans = INT_MAX;
    unordered_map<int, int> last;
    for (int i = 0; i < n; i++) {
        if (last.count(cards[i]))
            ans = min(ans, i - last[cards[i]] + 1);
        last[cards[i]] = i;
    }
    return ans == INT_MAX ? -1 : ans;
}
```

---

## 二、字符串/序列 DP（4题）

### 8. 72 编辑距离

**类型：** 二维 DP

**核心思路：**
- `dp[i][j]` 表示 word1[0..i-1] 转换为 word2[0..j-1] 的最少操作数
- 初始化：`dp[i][0] = i`（删除 i 次），`dp[0][j] = j`（插入 j 次）
- 转移：字符相等 `dp[i][j] = dp[i-1][j-1]`
- 不等：`dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1`
  - `dp[i-1][j]`：删除 word1[i-1]
  - `dp[i][j-1]`：插入 word2[j-1]
  - `dp[i-1][j-1]`：替换

**代码骨架：**
```cpp
int minDistance(string word1, string word2) {
    int m = word1.size(), n = word2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1[i-1] == word2[j-1])
                dp[i][j] = dp[i-1][j-1];
            else
                dp[i][j] = min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]}) + 1;
        }
    }
    return dp[m][n];
}
```

---

### 9. 712 两个字符串的最小 ASCII 删除和

**类型：** 二维 DP（编辑距离变种）

**核心思路：**
- 和编辑距离类似，但删除操作代价是字符的 ASCII 码
- 初始化：`dp[i][0] = dp[i-1][0] + s1[i-1]`，删除 s1 的字符
- 转移：字符相等不删，不等时选删除代价最小的方案

**代码骨架：**
```cpp
int minimumDeleteSum(string s1, string s2) {
    int m = s1.size(), n = s2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) dp[i][0] = dp[i-1][0] + s1[i-1];
    for (int j = 1; j <= n; j++) dp[0][j] = dp[0][j-1] + s2[j-1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1[i-1] == s2[j-1])
                dp[i][j] = dp[i-1][j-1];
            else
                dp[i][j] = min(dp[i-1][j] + s1[i-1], dp[i][j-1] + s2[j-1]);
        }
    }
    return dp[m][n];
}
```

---

### 10. 1143 最长公共子序列

**类型：** 经典 LCS

**核心思路：**
- `dp[i][j]` 表示 text1[0..i-1] 和 text2[0..j-1] 的 LCS 长度
- 字符相等：`dp[i][j] = dp[i-1][j-1] + 1`
- 不等：`dp[i][j] = max(dp[i-1][j], dp[i][j-1])`

**代码骨架：**
```cpp
int longestCommonSubsequence(string text1, string text2) {
    int m = text1.size(), n = text2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1[i-1] == text2[j-1])
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}
```

---

### 11. 673 最长递增子序列的个数

**类型：** LIS 变种

**核心思路：**
- 维护两个数组：`len[i]`（以 i 结尾的 LIS 长度）和 `cnt[i]`（以 i 结尾的 LIS 个数）
- 对每个 i，遍历 j < i，如果 nums[j] < nums[i]：
  - `len[j] + 1 > len[i]`：更新长度，重置计数
  - `len[j] + 1 == len[i]`：累加计数

**代码骨架：**
```cpp
int findNumberOfLIS(vector<int>& nums) {
    int n = nums.size(), maxLen = 0, ans = 0;
    vector<int> len(n, 1), cnt(n, 1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                if (len[j] + 1 > len[i]) {
                    len[i] = len[j] + 1;
                    cnt[i] = cnt[j];
                } else if (len[j] + 1 == len[i]) {
                    cnt[i] += cnt[j];
                }
            }
        }
        if (len[i] > maxLen) { maxLen = len[i]; ans = cnt[i]; }
        else if (len[i] == maxLen) ans += cnt[i];
    }
    return ans;
}
```

---

## 三、矩阵/网格 DP（3题）

### 12. 63 不同路径 II

**类型：** 网格 DP

**核心思路：**
- `dp[i][j]` 表示到达 (i,j) 的路径数
- 有障碍物则 `dp[i][j] = 0`
- 否则 `dp[i][j] = dp[i-1][j] + dp[i][j-1]`
- 可滚动为一维数组优化空间

**代码骨架：**
```cpp
int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
    int m = obstacleGrid.size(), n = obstacleGrid[0].size();
    vector<int> dp(n, 0);
    dp[0] = obstacleGrid[0][0] ? 0 : 1;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (obstacleGrid[i][j]) { dp[j] = 0; continue; }
            if (j > 0) dp[j] += dp[j-1];
        }
    }
    return dp[n-1];
}
```

---

### 13. 221 最大正方形

**类型：** 矩阵 DP

**核心思路：**
- `dp[i][j]` 表示以 (i,j) 为右下角的最大正方形边长
- 位置为 '0' 则 `dp[i][j] = 0`
- 在边界上（i=0 或 j=0）则 `dp[i][j] = 1`
- 否则 `dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1`
- 答案取最大边长的平方

**代码骨架：**
```cpp
int maximalSquare(vector<vector<char>>& matrix) {
    int m = matrix.size(), n = matrix[0].size(), ans = 0;
    vector<vector<int>> dp(m, vector<int>(n, 0));
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (matrix[i][j] == '0') continue;
            if (i == 0 || j == 0) dp[i][j] = 1;
            else dp[i][j] = min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]}) + 1;
            ans = max(ans, dp[i][j]);
        }
    }
    return ans * ans;
}
```

---

### 14. 931 下降路径最小和

**类型：** 网格 DP

**核心思路：**
- 从第一行任意列开始，每行选一个，相邻行列差 ≤ 1
- `dp[i][j] = matrix[i][j] + min(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1])`
- 注意边界处理（j=0 和 j=n-1 时只有两个选择）
- 最后取最后一行的最小值

**代码骨架：**
```cpp
int minFallingPathSum(vector<vector<int>>& matrix) {
    int n = matrix.size();
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < n; j++) {
            int best = matrix[i-1][j];
            if (j > 0) best = min(best, matrix[i-1][j-1]);
            if (j < n-1) best = min(best, matrix[i-1][j+1]);
            matrix[i][j] += best;
        }
    }
    return *min_element(matrix[n-1].begin(), matrix[n-1].end());
}
```

---

## 四、枚举右维护左（4题）

这类题的核心模式：**遍历数组时，维护左侧的最优值，每次枚举右端点计算答案。**

### 15. 1014 最佳观光组合

**核心思路：**
- 求 `max(values[i] + values[j] + i - j) = max((values[i] + i) + (values[j] - j))`
- 遍历 j，维护 `maxVal = max(values[i] + i)`
- `ans = max(ans, maxVal + values[j] - j)`

**代码：**
```cpp
int maxScoreSightseeingPair(vector<int>& values, int n) {
    int ans = 0, max_i = values[0];
    for (int j = 1; j < n; j++) {
        ans = max(ans, max_i + values[j] - j);
        max_i = max(max_i, values[j] + j);
    }
    return ans;
}
```

---

### 16. 2871 有序三元组最大值

**核心思路：**
- 求 `max((nums[i] - nums[j]) * nums[k])`，i < j < k
- 枚举 k，维护 `maxSub = max(nums[i] - nums[j])`，`maxI = max(nums[i])`
- 每轮：`ans = max(ans, maxSub * nums[k])`，`maxSub = max(maxSub, maxI - nums[k])`，`maxI = max(maxI, nums[k])`
- 注意顺序：先算 ans，再更新 maxSub，最后更新 maxI

**代码：**
```cpp
long long maximumTripletValue(vector<int>& nums) {
    long long ans = 0;
    int maxI = 0, maxSub = 0;
    for (int k = 0; k < nums.size(); k++) {
        ans = max(ans, (long long)maxSub * nums[k]);
        maxSub = max(maxSub, maxI - nums[k]);
        maxI = max(maxI, nums[k]);
    }
    return ans;
}
```

---

### 17. 2909 和最小的山形三元组

**核心思路：**
- 找 i < j < k，满足 nums[i] < nums[j] > nums[k]，且和最小
- 预处理 `minL[i]`（左侧最小值）和 `minR[i]`（右侧最小值）
- 遍历 j，如果 nums[j] > minL[j] 且 nums[j] > minR[j]，则更新答案

**代码：**
```cpp
int minimumSum(vector<int>& nums) {
    int n = nums.size(), ans = INT_MAX;
    vector<int> minL(n, INT_MAX), minR(n, INT_MAX);
    for (int i = 1; i < n; i++) minL[i] = min(minL[i-1], nums[i-1]);
    for (int i = n-2; i >= 0; i--) minR[i] = min(minR[i+1], nums[i+1]);
    for (int i = 1; i < n-1; i++) {
        if (nums[i] > minL[i] && nums[i] > minR[i])
            ans = min(ans, nums[i] + minL[i] + minR[i]);
    }
    return ans == INT_MAX ? -1 : ans;
}
```

---

### 18. 3148 矩阵中的最大得分

**核心思路：**
- 求 `max(grid[i][j] - grid[i'][j'])`，其中 (i',j') 在 (i,j) 的左上区域
- 预处理左上角最小值矩阵，每个位置的值减去左上角最小值
- 类似「枚举右维护左」的二维扩展

**代码：**
```cpp
int maxScore(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size(), ans = INT_MIN;
    vector<vector<int>> minVal(m, vector<int>(n, INT_MAX));
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) continue;
            int top = i > 0 ? min(minVal[i-1][j], grid[i-1][j]) : INT_MAX;
            int left = j > 0 ? min(minVal[i][j-1], grid[i][j-1]) : INT_MAX;
            minVal[i][j] = min(top, left);
            ans = max(ans, grid[i][j] - minVal[i][j]);
        }
    }
    return ans;
}
```

---

# 第二部分：贪心（6题）

---

### 1. 洛谷题（灵珠收集）

**类型：** 简单贪心

**核心思路：**
- 两个灵珠，当前有一个 cur，新来一个 x
- 如果 x > 0：收走 x（累加 sum）
- 如果 x ≤ 0：销毁 cur，x 成为新的 cur
- 本质是贪心保留更优的"第一个灵珠"

---

### 2. 3143 正方形中的最多点数

**类型：** 排序 + 贪心

**核心思路：**
- 每个点需要的最小正方形边长 = max(|x|, |y|)
- 对 26 个字母，分别记录该字母点出现的最小和次小边长
- 取所有字母次小边长中的最小值作为限制 size
- 统计所有边长 < size 的点数

**关键：** 需要两个不同字母的标签不能重复，所以限制条件是某个字母第二次出现时的边长

---

### 3. 45 跳跃游戏 II

**类型：** 反向贪心

**核心思路：**
- 从终点向前找，每次找能跳到当前位置的最远左边的点
- 这其实是一种贪心：每次选择「能跳最远」的那个位置
- 正向做更高效：维护当前步能到达的边界和下一步能到达的最远距离

**正向贪心代码（更优）：**
```cpp
int jump(vector<int>& nums) {
    int ans = 0, curEnd = 0, curFarthest = 0;
    for (int i = 0; i < nums.size() - 1; i++) {
        curFarthest = max(curFarthest, i + nums[i]);
        if (i == curEnd) {
            ans++;
            curEnd = curFarthest;
        }
    }
    return ans;
}
```

---

### 4. 452 用最少数量的箭引爆气球

**类型：** 区间贪心

**核心思路：**
- 按区间右端点排序
- 第一支箭放在第一个区间的右端点
- 遍历后续区间，如果区间左端点在当前箭的位置右边，说明需要新箭
- 新箭放在该区间的右端点

**代码骨架：**
```cpp
int findMinArrowShots(vector<vector<int>>& points) {
    sort(points.begin(), points.end(), [](auto& a, auto& b) {
        return a[1] < b[1];
    });
    int ans = 1, pos = points[0][1];
    for (int i = 1; i < points.size(); i++) {
        if (points[i][0] > pos) {
            ans++;
            pos = points[i][1];
        }
    }
    return ans;
}
```

---

### 5. 995 K 连续位的最小翻转次数

**类型：** 滑动窗口 + 贪心

**核心思路：**
- 从左到右遍历，遇到 0 就翻转当前位置开始的 k 位
- 用差分思想优化：`act` 记录当前翻转次数，`nums[i-k] >= 2` 表示之前的一次翻转结束
- 如果当前位置实际值为 0 且剩余长度不够 k，返回 -1

**代码骨架：**
```cpp
int minKBitFlips(vector<int>& nums, int k) {
    int n = nums.size(), act = 0, m = 0;
    for (int i = 0; i < n; i++) {
        if (i >= k && nums[i - k] >= 2) { m++; nums[i - k] -= 2; }
        int cur = (nums[i] % 2 + act - m) % 2;
        if (cur == 0) {
            if (i + k > n) return -1;
            act++;
            nums[i] += 2;
        }
    }
    return act;
}
```

---

### 6. 56 合并区间

**类型：** 区间贪心

**核心思路：**
- 按左端点排序
- 遍历区间，如果当前区间左端点 > 上一个合并区间的右端点，则无法合并，开新区间
- 否则合并，更新右端点为最大值

**代码骨架：**
```cpp
vector<vector<int>> merge(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> ans;
    for (auto& v : intervals) {
        if (ans.empty() || v[0] > ans.back()[1])
            ans.push_back(v);
        else
            ans.back()[1] = max(ans.back()[1], v[1]);
    }
    return ans;
}
```

---

# 附录：码蹄杯考频速查

| 类型 | 题号 | 难度 | 码蹄杯考频 | 备注 |
|------|------|------|-----------|------|
| 状态机DP | 122 | ⭐⭐ | 中 | 股票系列变种多 |
| 完全背包 | 322 | ⭐⭐⭐ | 中高 | 背包问题高频 |
| 线性DP | 198 | ⭐⭐ | 中 | 打家劫舍系列 |
| 字符串DP | 72/1143 | ⭐⭐⭐ | 中 | 编辑距离/LCS |
| 网格DP | 63/931 | ⭐⭐ | 中高 | 路径类高频 |
| 矩阵DP | 221 | ⭐⭐⭐ | 中 | 最大正方形 |
| 枚举右维护左 | 1014/2871 | ⭐⭐ | 中 | 近期高频新题型 |
| 区间贪心 | 452/56 | ⭐⭐ | 高 | 区间类高频必考 |
| 跳跃游戏 | 45 | ⭐⭐ | 中 | 贪心经典题 |
| 滑动窗口贪心 | 995 | ⭐⭐⭐ | 中 | 差分+贪心 |

---

> **复习建议：** 优先看背包类（322）、区间贪心（452/56）、网格路径（63/931）和枚举右维护左（1014/2871）——这四类是码蹄杯高频考点，性价比最高。
