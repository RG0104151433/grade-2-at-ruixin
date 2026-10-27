// 来源：endlesscheng《教你一步步思考 DP：从记忆化搜索到递推到空间优化！（Python/Java/C++/Go）》
// https://leetcode.cn/problems/unique-paths-ii/solutions/jiao-ni-yi-bu-bu-si-kao-dpcong-ji-yi-hua-451i/
// 小节：六、空间优化（原地修改）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int m = obstacleGrid.size(), n = obstacleGrid[0].size();
        auto& f = obstacleGrid[0];
        f[0] ^= 1; // 0 变成 1，1 变成 0
        for (int j = 1; j < n; j++) {
            f[j] = f[j] ? 0 : f[j - 1];
        }
        for (int i = 1; i < m; i++) {
            if (obstacleGrid[i][0]) {
                f[0] = 0;
            }
            for (int j = 1; j < n; j++) {
                if (obstacleGrid[i][j] == 0) {
                    f[j] += f[j - 1];
                } else {
                    f[j] = 0;
                }
            }
        }
        return f[n - 1];
    }
};
