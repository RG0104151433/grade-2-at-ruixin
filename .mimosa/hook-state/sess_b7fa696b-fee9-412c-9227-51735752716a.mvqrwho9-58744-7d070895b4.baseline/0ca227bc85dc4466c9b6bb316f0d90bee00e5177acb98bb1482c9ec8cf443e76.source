// 来源：endlesscheng《二分查找总是写不对？一个视频讲透！（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/search-insert-position/solutions/er-fen-cha-zhao-zong-shi-xie-bu-dui-yi-g-nq23/
// 小节：库函数写法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        return ranges::lower_bound(nums, target) - nums.begin();
    }
};
