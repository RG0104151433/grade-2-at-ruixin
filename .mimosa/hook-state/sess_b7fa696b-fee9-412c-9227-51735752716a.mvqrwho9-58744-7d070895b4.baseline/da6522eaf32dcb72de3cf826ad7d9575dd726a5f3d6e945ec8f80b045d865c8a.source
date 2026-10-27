// 计算二维数组中数值总和可以被k整除的岛屿数 
class Solution {
public:
    int directions[4][2]={{0,1},{0,-1},{1,0},{-1,0}};
    int col,row;
    void dfs(vector<vector<int>>& grid,int i,int j,long long& sum) {
        if (i<0 || j<0 || i>=col || j>=row) return ;
        if (!grid[i][j]) return ;
        if (grid[i][j]) sum+=grid[i][j];
        grid[i][j]=0;
        for (int n=0;n<4;n++) {
            int ni=i+directions[n][0];
            int nj=j+directions[n][1];
            dfs(grid,ni,nj,sum);
        }
    }
    int countIslands(vector<vector<int>>& grid, int k) {
        col=grid.size(),row=grid[0].size();
        int ans=0;
        for (int i=0;i<col;i++) {
            for (int j=0;j<row;j++) {
                if (!grid[i][j]) continue;
                long long sum=0;
                dfs(grid,i,j,sum);
                if (sum%k==0) ans++;
            }
        }
        return ans;
    }
};
