// 来源：endlesscheng《两种方法：排序+二分 / 计数+值域后缀和（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/successful-pairs-of-spells-and-potions/solutions/by-endlesscheng-1kbp/
// 小节：写法二：不使用浮点数
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> successfulPairs(vector<int>& spells, vector<int>& potions, long long success) {
        ranges::sort(potions);
        for (int& x : spells) { // 原地修改
            long long target = (success - 1) / x;
            if (target < potions.back()) {
                // 这样写每次二分就只用比两个 int 的大小，避免把 potions 中的元素转成 long long 比较
                x = potions.end() - ranges::upper_bound(potions, (int) target);
            } else {
                x = 0;
            }
        }
        return spells;
    }
};
