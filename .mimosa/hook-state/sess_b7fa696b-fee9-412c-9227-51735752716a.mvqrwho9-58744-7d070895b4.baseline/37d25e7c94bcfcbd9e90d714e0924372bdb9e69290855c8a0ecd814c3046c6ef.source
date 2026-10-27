// 来源：endlesscheng《教你一步步思考 DP：从记忆化搜索到递推到空间优化！（Python/Java/C++/Go）》
// https://leetcode.cn/problems/unique-paths-ii/solutions/jiao-ni-yi-bu-bu-si-kao-dpcong-ji-yi-hua-451i/
// 小节：四、1:1 翻译成递推
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int m = obstacleGrid.size(), n = obstacleGrid[0].size();
        vector f(m + 1, vector<int>(n + 1));
        f[0][1] = 1;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (obstacleGrid[i][j] == 0) {
                    f[i + 1][j + 1] = f[i][j + 1] + f[i + 1][j];
                }
            }
        }
        return f[m][n];
    }
};
