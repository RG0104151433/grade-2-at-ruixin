// 来源：endlesscheng《排序+滑动窗口（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-removals-to-balance-array/solutions/pai-xu-hua-dong-chuang-kou-pythonjavacgo-pfho/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minRemoval(vector<int>& nums, int k) {
        ranges::sort(nums);
        int max_save = 0, left = 0;
        for (int i = 0; i < nums.size(); i++) {
            while (1LL * nums[left] * k < nums[i]) {
                left++;
            }
            max_save = max(max_save, i - left + 1);
        }
        return nums.size() - max_save;
    }
};
