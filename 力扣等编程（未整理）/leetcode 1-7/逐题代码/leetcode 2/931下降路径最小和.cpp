//给你一个 n x n 的 方形 整数数组 matrix ，请你找出并返回通过 matrix 的下降路径 的 最小和 。下降路径 可以从第一行中的任何元素开始，并从每一行中选择一个元素。在下一行选择的元素和当前行所选元素最多相隔一列（即位于正下方或者沿对角线向左或者向右的第一个元素）。具体来说，位置 (row, col) 的下一个元素应当是 (row + 1, col - 1)、(row + 1, col) 或者 (row + 1, col + 1) 。
int minFallingPathSum(int** matrix, int matrixSize, int* matrixColSize) {
    if (matrixSize==1) return matrix[0][0];
    int row=matrixSize,col=matrixColSize[0],result=INT_MAX;
    int ans[row][col];
    for (int i=0;i<row;i++) {
        for (int j=0;j<col;j++) {
            ans[i][j]=matrix[i][j];
            if (i==0) continue;
            else {
                if (j==0) ans[i][j]+=ans[i-1][j]<ans[i-1][j+1]?ans[i-1][j]:ans[i-1][j+1];
                else if (j==col-1) ans[i][j]+=ans[i-1][j-1]<ans[i-1][j]?ans[i-1][j-1]:ans[i-1][j];
                else {
                    int temp=ans[i-1][j];
                    temp=temp<ans[i-1][j-1]?temp:ans[i-1][j-1];
                    temp=temp<ans[i-1][j+1]?temp:ans[i-1][j+1];
                    ans[i][j]+=temp;
                }
            }
        }
    }
    for (int i=0;i<col;i++) result=ans[row-1][i]<result?ans[row-1][i]:result;
    return result;
}
