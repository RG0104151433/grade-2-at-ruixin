// 来源：endlesscheng《教你一步步思考 DP：从记忆化搜索到递推到空间优化！（Python/Java/C++/Go）》
// https://leetcode.cn/problems/unique-paths-ii/solutions/jiao-ni-yi-bu-bu-si-kao-dpcong-ji-yi-hua-451i/
// 小节：五、空间优化
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int n = obstacleGrid[0].size();
        vector<int> f(n + 1);
        f[1] = 1;
        for (auto& row : obstacleGrid) {
            for (int j = 0; j < n; j++) {
                if (row[j] == 0) {
                    f[j + 1] += f[j];
                } else {
                    f[j + 1] = 0;
                }
            }
        }
        return f[n];
    }
};
