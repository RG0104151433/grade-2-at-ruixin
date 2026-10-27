// 来源：endlesscheng《严格证明，简洁写法（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/find-peak-element/solutions/by-endlesscheng-9ass/
// 小节：细节
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int left = -1, right = nums.size() - 1; // 开区间 (-1, n-1)
        while (left + 1 < right) { // 开区间不为空
            int mid = left + (right - left) / 2;
            if (nums[mid] > nums[mid + 1]) { // 下坡，峰顶位置 <= mid
                right = mid;
            } else { // 上坡，峰顶位置 > mid
                left = mid;
            }
        }
        return right;
    }
};
