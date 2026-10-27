// 来源：endlesscheng《O(n) 定长滑动窗口（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/k-radius-subarray-averages/solutions/on-hua-dong-chuang-kou-by-endlesscheng-jtr5/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> getAverages(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> avgs(n, -1);
        long long s = 0; // 维护窗口元素和（注意类型！）
        for (int i = 0; i < n; i++) {
            // 1. 进入窗口
            s += nums[i];
            if (i < k * 2) { // 窗口大小不足 2k+1
                continue;
            }
            // 2. 记录答案
            avgs[i - k] = s / (k * 2 + 1);
            // 3. 离开窗口
            s -= nums[i - k * 2];
        }
        return avgs;
    }
};
