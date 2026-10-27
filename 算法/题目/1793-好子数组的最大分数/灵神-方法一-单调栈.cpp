// 来源：endlesscheng《两种方法：单调栈/双指针（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/maximum-score-of-a-good-subarray/solutions/liang-chong-fang-fa-dan-diao-zhan-shuang-24zl/
// 小节：方法一：单调栈
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maximumScore(vector<int> &nums, int k) {
        int n = nums.size();
        vector<int> left(n, -1);
        stack<int> st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && nums[i] <= nums[st.top()]) {
                st.pop();
            }
            if (!st.empty()) {
                left[i] = st.top();
            }
            st.push(i);
        }

        vector<int> right(n, n);
        st = stack<int>();
        for (int i = n - 1; i >= 0; i--) {
            while (!st.empty() && nums[i] <= nums[st.top()]) {
                st.pop();
            }
            if (!st.empty()) {
                right[i] = st.top();
            }
            st.push(i);
        }

        int ans = 0;
        for (int i = 0; i < n; i++) {
            int h = nums[i], l = left[i], r = right[i];
            if (l < k && k < r) { // 相比 84 题多了个 if 判断
                ans = max(ans, h * (r - l - 1));
            }
        }
        return ans;
    }
};
