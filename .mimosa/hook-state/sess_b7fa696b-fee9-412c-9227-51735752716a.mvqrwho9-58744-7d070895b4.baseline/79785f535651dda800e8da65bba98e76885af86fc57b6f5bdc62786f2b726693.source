// 给定一个 m x n 的整数数组 grid。一个机器人初始位于 左上角（即 grid[0][0]）。机器人尝试移动到 右下角（即 grid[m - 1][n - 1]）。机器人每次只能向下或者向右移动一步。
// 网格中的障碍物和空位置分别用 1 和 0 来表示。机器人的移动路径中不能包含 任何 有障碍物的方格。
// 返回机器人能够到达右下角的不同路径数量。
// 测试用例保证答案小于等于 2 * 109。

int uniquePathsWithObstacles(int** obstacleGrid, int obstacleGridSize, int* obstacleGridColSize) {
    int row = obstacleGridSize, col = obstacleGridColSize[0];
    int ans[row][col];
    ans[0][0] = (obstacleGrid[0][0] == 0) ? 1 : 0;// 初始化起点：如果是障碍物则为0，否则为1
    for (int i = 0; i < row; i++) {
        for (int j = 0; j < col; j++) {
            if (i == 0 && j == 0) continue;// 起点已初始化，跳过
            if (obstacleGrid[i][j] == 1) {
                ans[i][j] = 0;
                continue;
            }// 如果当前格子是障碍物，路径数为0
            // 计算从上方的路径数（如果上方存在且不是障碍物）
            int fromTop = (i - 1 >= 0 && obstacleGrid[i-1][j] == 0) ? ans[i-1][j] : 0;
            // 计算从左方的路径数（如果左方存在且不是障碍物）
            int fromLeft = (j - 1 >= 0 && obstacleGrid[i][j-1] == 0) ? ans[i][j-1] : 0;
            ans[i][j] = fromTop + fromLeft;
        }
    }
    return ans[row-1][col-1];
}
