// 来源：endlesscheng《两种方法：完全背包 / BFS 最短路（Python/Java/C++/Go）》
// https://leetcode.cn/problems/coin-change/solutions/jiao-ni-yi-bu-bu-si-kao-dong-tai-gui-hua-21m5/
// 小节：二、1:1 翻译成递推
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int n = coins.size();
        vector f(n + 1, vector<int>(amount + 1, INT_MAX / 2)); // 除 2 防止下面 + 1 溢出
        f[0][0] = 0;
        for (int i = 0; i < n; i++) {
            for (int c = 0; c <= amount; c++) {
                if (c < coins[i]) {
                    f[i + 1][c] = f[i][c];
                } else {
                    f[i + 1][c] = min(f[i][c], f[i + 1][c - coins[i]] + 1);
                }
            }
        }
        int ans = f[n][amount];
        return ans < INT_MAX / 2 ? ans : -1;
    }
};
