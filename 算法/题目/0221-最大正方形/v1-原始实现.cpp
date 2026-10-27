/*
 *在一个由 '0' 和 '1' 组成的二维矩阵内，找到只包含 '1' 的最大正方形，并返回其面积。
 *思路：定义的矩阵每个位置保存的是以该位置为右下角的正方形的边长
 *如果这个位置是0那就是0
 *如果这个位置在两边或上左左上三个位置中有一个为'0'则为1
 *如果周围都是1那么这个位置的值就是那三个中最小的一个再加1
 *注意是char类型输入，输出的是面积不是边长1
 */
int maximalSquare(char** matrix, int matrixSize, int* matrixColSize) {
    int row=matrixSize,col=matrixColSize[0],result=0;
    int ans[row][col];
    for (int i=0;i<row;i++) {
        for (int j=0;j<col;j++) {
            if (matrix[i][j]=='0') ans[i][j]=0;
            else if (i==0||j==0||matrix[i-1][j]=='0'||matrix[i][j-1]=='0'||matrix[i-1][j-1]=='0') ans[i][j]=1;
            else {
                int temp=ans[i-1][j-1];
                temp=temp<ans[i-1][j]?temp:ans[i-1][j];
                temp=temp<ans[i][j-1]?temp:ans[i][j-1];
                ans[i][j]=temp+1;
            }
            result=ans[i][j]>result?ans[i][j]:result;
        }
    }
    return result*result;
}
