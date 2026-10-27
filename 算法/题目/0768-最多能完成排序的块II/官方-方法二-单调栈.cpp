// 来源：LeetCode-Solution《最多能完成排序的块 II》
// https://leetcode.cn/problems/max-chunks-to-make-sorted-ii/solutions/zui-duo-neng-wan-cheng-pai-xu-de-kuai-ii-w5c6/
// 小节：方法二：单调栈
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxChunksToSorted(vector<int>& arr) {
        stack<int> st;
        for (auto &num : arr) {
            if (st.empty() || num >= st.top()) {
                st.emplace(num);
            } else {
                int mx = st.top();
                st.pop();
                while (!st.empty() && st.top() > num) {
                    st.pop();
                }
                st.emplace(mx);
            }
        }
        return st.size();
    }
};
