// 来源：endlesscheng《三种方法：二分查找 / 相向三指针 / 两次相向双指针（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/count-the-number-of-fair-pairs/solutions/er-fen-cha-zhao-de-ling-huo-yun-yong-by-wplbj/
// 小节：方法一：二分查找
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        ranges::sort(nums);
        long long ans = 0;
        for (int j = 0; j < nums.size(); j++) {
            // 题目要求 i < j，所以要在 [0, j-1] 中二分
            auto r = upper_bound(nums.begin(), nums.begin() + j, upper - nums[j]);
            auto l = lower_bound(nums.begin(), nums.begin() + j, lower - nums[j]);
            ans += r - l;
        }
        return ans;
    }
};
