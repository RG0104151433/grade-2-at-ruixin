// 来源：endlesscheng《打家劫舍变形题，查表法 / 刷表法（Python/Java/C++/Go）》
// https://leetcode.cn/problems/solving-questions-with-brainpower/solutions/dao-xu-dp-by-endlesscheng-2qkc/
// 小节：思路
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long mostPoints(vector<vector<int>>& questions) {
        int n = questions.size();
        vector<long long> f(n + 1);
        for (int i = 0; i < n; i++) {
            f[i + 1] = max(f[i + 1], f[i]);
            auto& q = questions[i];
            int j = min(i + q[1] + 1, n);
            f[j] = max(f[j], f[i] + q[0]);
        }
        return f[n];
    }
};
