// 来源：endlesscheng《一步步优化：从三次遍历到一次遍历（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/largest-rectangle-in-histogram/solutions/dan-diao-zhan-fu-ti-dan-pythonjavacgojsr-89s7/
// 小节：写法三：一次遍历
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        heights.push_back(-1); // 最后大火收汁，用 -1 把栈清空
        stack<int> st;
        st.push(-1); // 在栈中只有一个数的时候，栈顶的「下面那个数」是 -1，对应 left[i] = -1 的情况
        int ans = 0;
        for (int right = 0; right < heights.size(); right++) {
            int h = heights[right];
            while (st.size() > 1 && heights[st.top()] >= h) {
                int i = st.top(); // 矩形的高（的下标）
                st.pop();
                int left = st.top(); // 栈顶下面那个数就是 left
                ans = max(ans, heights[i] * (right - left - 1));
            }
            st.push(right);
        }
        return ans;
    }
};
