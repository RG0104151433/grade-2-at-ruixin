// 来源：endlesscheng《两种方法：排序+二分 / 计数+值域后缀和（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/successful-pairs-of-spells-and-potions/solutions/by-endlesscheng-1kbp/
// 小节：方法二：计数 + 值域后缀和
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> successfulPairs(vector<int>& spells, vector<int>& potions, long long success) {
        int mx = ranges::max(potions);
        vector<int> cnt(mx + 1);
        for (int y : potions) {
            cnt[y]++; // 统计每种药水的出现次数
        }

        // 计算 cnt 的后缀和
        for (int i = mx - 1; i >= 0; i--) {
            cnt[i] += cnt[i + 1];
        }
        // 计算完毕后，cnt[i] 就是 potions 值 >= i 的药水个数

        for (int& x : spells) {
            long long low = (success - 1) / x + 1;
            x = low <= mx ? cnt[low] : 0;
        }
        return spells;
    }
};
