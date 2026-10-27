// 来源：endlesscheng《两种方法：单调栈/双指针（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/maximum-score-of-a-good-subarray/solutions/liang-chong-fang-fa-dan-diao-zhan-shuang-24zl/
// 小节：方法二：双指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maximumScore(vector<int> &nums, int k) {
        int n = nums.size();
        int ans = nums[k], min_h = nums[k];
        int i = k, j = k;
        for (int t = 0; t < n - 1; t++) { // 循环 n-1 次
            if (j == n - 1 || i && nums[i - 1] > nums[j + 1]) {
                min_h = min(min_h, nums[--i]);
            } else {
                min_h = min(min_h, nums[++j]);
            }
            ans = max(ans, min_h * (j - i + 1));
        }
        return ans;
    }
};
