// 来源：endlesscheng《两种方法：完全背包 / BFS 最短路（Python/Java/C++/Go）》
// https://leetcode.cn/problems/coin-change/solutions/jiao-ni-yi-bu-bu-si-kao-dong-tai-gui-hua-21m5/
// 小节：四、空间优化：一个数组
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> f(amount + 1, INT_MAX / 2);
        f[0] = 0;
        for (int x : coins) {
            for (int c = x; c <= amount; c++) {
                f[c] = min(f[c], f[c - x] + 1);
            }
        }
        int ans = f[amount];
        return ans < INT_MAX / 2 ? ans : -1;
    }
};
