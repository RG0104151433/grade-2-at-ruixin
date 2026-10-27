// 来源：LeetCode-Solution《最长定差子序列》
// https://leetcode.cn/problems/longest-arithmetic-subsequence-of-given-difference/solutions/zui-chang-ding-chai-zi-xu-lie-by-leetcod-xkua/
// 小节：方法一：动态规划
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int longestSubsequence(vector<int> &arr, int difference) {
        int ans = 0;
        unordered_map<int, int> dp;
        for (int v: arr) {
            dp[v] = dp[v - difference] + 1;
            ans = max(ans, dp[v]);
        }
        return ans;
    }
};
