// 来源：endlesscheng《降本增笑，秒懂单调队列！附题单！（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/sliding-window-maximum/solutions/shi-pin-yi-ge-shi-pin-miao-dong-dan-diao-ezj6/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> ans(n - k + 1); // 窗口个数
        deque<int> q; // 双端队列

        for (int i = 0; i < n; i++) {
            // 1. 右边入
            while (!q.empty() && nums[q.back()] <= nums[i]) {
                q.pop_back(); // 维护 q 的单调性
            }
            q.push_back(i); // 注意保存的是下标，这样下面可以判断队首是否离开窗口

            // 2. 左边出
            int left = i - k + 1; // 窗口左端点
            if (q.front() < left) { // 队首离开窗口
                q.pop_front();
            }

            // 3. 在窗口左端点处记录答案
            if (left >= 0) {
                // 由于队首到队尾单调递减，所以窗口最大值就在队首
                ans[left] = nums[q.front()];
            }
        }

        return ans;
    }
};
