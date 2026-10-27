// 来源：endlesscheng《打家劫舍变形题，查表法 / 刷表法（Python/Java/C++/Go）》
// https://leetcode.cn/problems/solving-questions-with-brainpower/solutions/dao-xu-dp-by-endlesscheng-2qkc/
// 小节：三、递归搜索 + 保存递归返回值 = 记忆化搜索
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long mostPoints(vector<vector<int>>& questions) {
        int n = questions.size();
        vector<long long> memo(n);
        auto dfs = [&](this auto&& dfs, int i) -> long long {
            if (i >= n) {
                return 0;
            }
            long long& res = memo[i]; // 注意这里是引用
            if (res) { // 之前计算过
                return res;
            }
            return res = max(dfs(i + 1), dfs(i + questions[i][1] + 1) + questions[i][0]);
        };
        return dfs(0);
    }
};
