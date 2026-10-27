// 来源：endlesscheng《三种方法：二分查找 / 相向三指针 / 两次相向双指针（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/count-the-number-of-fair-pairs/solutions/er-fen-cha-zhao-de-ling-huo-yun-yong-by-wplbj/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        ranges::sort(nums);

        auto count = [&](int upper) {
            long long res = 0;
            int j = nums.size() - 1;
            for (int i = 0; i < nums.size(); i++) {
                while (j > i && nums[j] > upper - nums[i]) {
                    j--;
                }
                if (j == i) {
                    break;
                }
                res += j - i;
            }
            return res;
        };

        return count(upper) - count(lower - 1);
    }
};
