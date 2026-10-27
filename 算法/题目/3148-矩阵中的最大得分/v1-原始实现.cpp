int maxScore(int** grid, int gridSize, int* gridColSize) {
    int min[gridSize][gridColSize[0]],result=INT_MIN;
    min[0][0]=INT_MAX;
    for (int i=1;i<gridSize;i++) {
        min[i][0]=min[i-1][0]<grid[i-1][0]?min[i-1][0]:grid[i-1][0];
    }
    for (int i=1;i<gridColSize[0];i++) {
        min[0][i]=min[0][i-1]<grid[0][i-1]?min[0][i-1]:grid[0][i-1];
    }
    for (int i=1;i<gridSize;i++) {
        for (int j=1;j<gridColSize[0];j++) {
            int u=min[i-1][j]<grid[i-1][j]?min[i-1][j]:grid[i-1][j];
            int l=min[i][j-1]<grid[i][j-1]?min[i][j-1]:grid[i][j-1];
            min[i][j]=u<l?u:l;
        }
    }
    for (int i=0;i<gridSize;i++) {
        for (int j=0;j<gridColSize[0];j++) {
            result=result>grid[i][j]-min[i][j]?result:grid[i][j]-min[i][j];
        }
    }
    return result;
}
