// 来源：endlesscheng《两种方法：完全背包 / BFS 最短路（Python/Java/C++/Go）》
// https://leetcode.cn/problems/coin-change/solutions/jiao-ni-yi-bu-bu-si-kao-dong-tai-gui-hua-21m5/
// 小节：五、BFS 最短路
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> q = {0};
        vector<int8_t> vis(amount + 1);
        vis[0] = true;

        for (int step = 0; !q.empty(); step++) {
            auto tmp = move(q);
            for (int s : tmp) {
                if (s == amount) {
                    return step;
                }
                for (int x : coins) {
                    if (s <= amount - x && !vis[s + x]) { // 之前没有访问过
                        vis[s + x] = true; // 避免重复访问
                        q.push_back(s + x);
                    }
                }
            }
        }

        return -1;
    }
};
