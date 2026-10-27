// 来源：endlesscheng《【视频讲解】二分查找总是写不对？三种写法，一个视频讲透！（Python/Java/C++/C/Go/JS）》
// https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/solutions/er-fen-cha-zhao-zong-shi-xie-bu-dui-yi-g-t9l9/
// 小节：附：库函数写法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        // 也可以用 equal_range，见【C++ 写法二】
        int start = ranges::lower_bound(nums, target) - nums.begin();
        if (start == nums.size() || nums[start] != target) {
            return {-1, -1};
        }
        int end = ranges::upper_bound(nums, target) - nums.begin() - 1;
        return {start, end};
    }
};
