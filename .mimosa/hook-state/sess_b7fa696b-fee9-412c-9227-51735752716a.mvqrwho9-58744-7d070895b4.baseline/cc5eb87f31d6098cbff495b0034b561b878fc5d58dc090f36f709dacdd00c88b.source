// 来源：endlesscheng《O(n) 单调栈（Python/Java/C++/Go）》
// https://leetcode.cn/problems/find-the-number-of-subarrays-where-boundary-elements-are-maximum/solutions/on-dan-diao-zhan-pythonjavacgo-by-endles-y00d/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long numberOfSubarrays(vector<int>& nums) {
        long long ans = nums.size();
        stack<pair<int, int>> st;
        st.emplace(INT_MAX, 0); // 无穷大哨兵
        for (int x : nums) {
            while (x > st.top().first) {
                st.pop();
            }
            if (x == st.top().first) {
                ans += st.top().second++;
            } else {
                st.emplace(x, 1);
            }
        }
        return ans;
    }
};
