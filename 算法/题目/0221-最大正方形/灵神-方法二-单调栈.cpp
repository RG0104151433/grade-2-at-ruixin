// 来源：endlesscheng《【图解】两种方法：动态规划/单调栈（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/maximal-square/solutions/he-85-ti-yi-yang-de-zuo-fa-pythonjavaccg-az54/
// 小节：方法二：单调栈
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
    // 84. 柱状图中最大的矩形
    // 改成计算最大正方形的边长
    int largestSize(vector<int>& heights) {
        stack<int> st;
        st.push(-1); // 在栈中只有一个数的时候，栈顶的「下面那个数」是 -1，对应 left[i] = -1 的情况
        int ans = 0;
        for (int right = 0; right < heights.size(); right++) {
            int h = heights[right];
            while (st.size() > 1 && heights[st.top()] >= h) {
                int i = st.top(); // 矩形的高（的下标）
                st.pop();
                int left = st.top(); // 栈顶下面那个数就是 left
                ans = max(ans, min(heights[i], right - left - 1));
            }
            st.push(right);
        }
        return ans;
    }

public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int n = matrix[0].size();
        vector<int> heights(n + 1); // 末尾多一个 0，理由见我 84 题题解
        int ans = 0;
        for (auto& row : matrix) {
            // 计算底边为 row 的柱子高度
            for (int j = 0; j < n; j++) {
                if (row[j] == '0') {
                    heights[j] = 0; // 柱子高度为 0
                } else {
                    heights[j]++; // 柱子高度加一
                }
            }
            ans = max(ans, largestSize(heights));
        }
        return ans * ans;
    }
};
