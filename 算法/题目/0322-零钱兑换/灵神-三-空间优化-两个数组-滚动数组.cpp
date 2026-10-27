// 来源：endlesscheng《两种方法：完全背包 / BFS 最短路（Python/Java/C++/Go）》
// https://leetcode.cn/problems/coin-change/solutions/jiao-ni-yi-bu-bu-si-kao-dong-tai-gui-hua-21m5/
// 小节：三、空间优化：两个数组（滚动数组）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int n = coins.size();
        vector f(2, vector<int>(amount + 1, INT_MAX / 2));
        f[0][0] = 0;
        for (int i = 0; i < n; i++) {
            for (int c = 0; c <= amount; c++) {
                if (c < coins[i]) {
                    f[(i + 1) % 2][c] = f[i % 2][c];
                } else {
                    f[(i + 1) % 2][c] = min(f[i % 2][c], f[(i + 1) % 2][c - coins[i]] + 1);
                }
            }
        }
        int ans = f[n % 2][amount];
        return ans < INT_MAX / 2 ? ans : -1;
    }
};
