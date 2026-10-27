// 来源：endlesscheng《三种方法：二分查找 / 相向三指针 / 两次相向双指针（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/count-the-number-of-fair-pairs/solutions/er-fen-cha-zhao-de-ling-huo-yun-yong-by-wplbj/
// 小节：方法二：相向三指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        ranges::sort(nums);
        long long ans = 0;
        int l = nums.size(), r = l;
        for (int j = 0; j < nums.size(); j++) {
            while (r && nums[r - 1] > upper - nums[j]) {
                r--;
            }
            while (l && nums[l - 1] >= lower - nums[j]) {
                l--;
            }
            // 在方法一中，二分的结果必须 <= j
            // 方法二同理，要保证 l 和 r 都 <= j
            ans += min(r, j) - min(l, j);
        }
        return ans;
    }
};
