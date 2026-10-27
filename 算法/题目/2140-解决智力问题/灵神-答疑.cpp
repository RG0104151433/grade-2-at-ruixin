// 来源：endlesscheng《打家劫舍变形题，查表法 / 刷表法（Python/Java/C++/Go）》
// https://leetcode.cn/problems/solving-questions-with-brainpower/solutions/dao-xu-dp-by-endlesscheng-2qkc/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long mostPoints(vector<vector<int>>& questions) {
        int n = questions.size();
        vector<long long> f(n + 1);
        for (int i = n - 1; i >= 0; i--) {
            int j = min(i + questions[i][1] + 1, n);
            f[i] = max(f[i + 1], f[j] + questions[i][0]);
        }
        return f[0];
    }
};
