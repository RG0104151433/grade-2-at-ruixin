// 来源：endlesscheng《教你一步步思考 DP：从记忆化搜索到递推到空间优化！（Python/Java/C++/Go）》
// https://leetcode.cn/problems/unique-paths-ii/solutions/jiao-ni-yi-bu-bu-si-kao-dpcong-ji-yi-hua-451i/
// 小节：三、递归搜索 + 保存递归返回值 = 记忆化搜索
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int m = obstacleGrid.size(), n = obstacleGrid[0].size();
        vector memo(m, vector<int>(n, -1)); // -1 表示没有计算过
        auto dfs = [&](this auto&& dfs, int i, int j) -> int {
            if (i < 0 || j < 0 || obstacleGrid[i][j]) {
                return 0;
            }
            if (i == 0 && j == 0) {
                return 1;
            }
            int& res = memo[i][j]; // 注意这里是引用
            if (res != -1) { // 之前计算过
                return res;
            }
            return res = dfs(i - 1, j) + dfs(i, j - 1);
        };
        return dfs(m - 1, n - 1);
    }
};
