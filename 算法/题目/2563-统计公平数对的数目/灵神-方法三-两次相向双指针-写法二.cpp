// 来源：endlesscheng《三种方法：二分查找 / 相向三指针 / 两次相向双指针（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/count-the-number-of-fair-pairs/solutions/er-fen-cha-zhao-de-ling-huo-yun-yong-by-wplbj/
// 小节：写法二
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        ranges::sort(nums);

        auto count = [&](int upper) {
            long long res = 0;
            int i = 0, j = nums.size() - 1;
            while (i < j) {
                if (nums[i] + nums[j] <= upper) {
                    res += j - i;
                    i++;
                } else {
                    j--;
                }
            }
            return res;
        };

        return count(upper) - count(lower - 1);
    }
};
