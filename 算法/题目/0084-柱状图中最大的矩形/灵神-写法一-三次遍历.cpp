// 来源：endlesscheng《一步步优化：从三次遍历到一次遍历（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/largest-rectangle-in-histogram/solutions/dan-diao-zhan-fu-ti-dan-pythonjavacgojsr-89s7/
// 小节：写法一：三次遍历
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int largestRectangleArea(vector<int> &heights) {
        int n = heights.size();
        vector<int> left(n, -1);
        stack<int> st;
        for (int i = 0; i < n; i++) {
            int h = heights[i];
            while (!st.empty() && heights[st.top()] >= h) {
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
            int h = heights[i];
            while (!st.empty() && heights[st.top()] >= h) {
                st.pop();
            }
            if (!st.empty()) {
                right[i] = st.top();
            }
            st.push(i);
        }

        int ans = 0;
        for (int i = 0; i < n; i++) {
            ans = max(ans, heights[i] * (right[i] - left[i] - 1));
        }
        return ans;
    }
};
