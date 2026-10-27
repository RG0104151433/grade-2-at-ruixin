// 来源：endlesscheng《【模板】定长滑动窗口（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/maximum-average-subarray-i/solutions/mo-ban-ding-chang-hua-dong-chuang-kou-py-1jxk/
// 小节：定长滑窗套路
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        int max_s = INT_MIN; // 窗口元素和的最大值
        int s = 0; // 维护窗口元素和
        for (int i = 0; i < nums.size(); i++) {
            // 1. 进入窗口
            s += nums[i];
            if (i < k - 1) { // 窗口大小不足 k
                continue;
            }
            // 2. 更新答案
            max_s = max(max_s, s);
            // 3. 离开窗口
            s -= nums[i - k + 1];
        }
        return (double) max_s / k;
    }
};
