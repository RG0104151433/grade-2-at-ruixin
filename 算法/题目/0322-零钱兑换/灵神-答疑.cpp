// 来源：endlesscheng《两种方法：完全背包 / BFS 最短路（Python/Java/C++/Go）》
// https://leetcode.cn/problems/coin-change/solutions/jiao-ni-yi-bu-bu-si-kao-dong-tai-gui-hua-21m5/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int n = coins.size();
        vector memo(n, vector<int>(amount + 1, -1)); // -1 表示没有计算过

        // lambda 递归函数
        auto dfs = [&](this auto&& dfs, int i, int c) -> int {
            if (i < 0) {
                return c == 0 ? 0 : INT_MAX / 2; // 除 2 防止下面 + 1 溢出
            }
            int& res = memo[i][c]; // 注意这里是引用
            if (res != -1) { // 之前计算过
                return res;
            }
            if (c < coins[i]) { // 只能不选
                return res = dfs(i - 1, c);
            }
            // 不选 vs 继续选
            return res = min(dfs(i - 1, c), dfs(i, c - coins[i]) + 1);
        };

        int ans = dfs(n - 1, amount);
        return ans < INT_MAX / 2 ? ans : -1;
    }
};
