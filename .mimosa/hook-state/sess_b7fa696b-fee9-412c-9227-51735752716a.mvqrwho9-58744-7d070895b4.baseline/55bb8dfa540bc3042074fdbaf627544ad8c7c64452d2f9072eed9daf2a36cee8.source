// 来源：endlesscheng《O(n) 做法：滑动窗口 + 单调队列（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/solutions/on-zuo-fa-hua-dong-chuang-kou-dan-diao-d-g45r/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int longestSubarray(vector<int>& nums, int limit) {
        deque<int> min_q, max_q;
        int ans = 0, left = 0;

        for (int i = 0; i < nums.size(); i++) {
            int x = nums[i];

            // 1. 右边入
            while (!min_q.empty() && x <= nums[min_q.back()]) {
                min_q.pop_back();
            }
            min_q.push_back(i);

            while (!max_q.empty() && x >= nums[max_q.back()]) {
                max_q.pop_back();
            }
            max_q.push_back(i);

            // 2. 左边出
            while (nums[max_q.front()] - nums[min_q.front()] > limit) {
                left++;
                if (min_q.front() < left) { // 队首不在窗口中
                    min_q.pop_front();
                }
                if (max_q.front() < left) { // 队首不在窗口中
                    max_q.pop_front();
                }
            }

            // 3. 更新答案
            ans = max(ans, i - left + 1);
        }

        return ans;
    }
};
