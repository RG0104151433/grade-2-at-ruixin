// 来源：endlesscheng《两种方法：排序+二分 / 计数+值域后缀和（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/successful-pairs-of-spells-and-potions/solutions/by-endlesscheng-1kbp/
// 小节：写法一：使用浮点数
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> successfulPairs(vector<int>& spells, vector<int>& potions, long long success) {
        ranges::sort(potions);
        for (int& x : spells) { // 原地修改
            x = potions.end() - ranges::lower_bound(potions, 1.0 * success / x);
        }
        return spells;
    }
};
