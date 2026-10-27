// 寻找完全被1包围的0群（陆地）数量
class Solution {
public:
    int direction[4][2]={{0,-1},{0,1},{-1,0},{1,0}};
    int col,row;
    void dfs(vector<vector<int>> grid,int i,int j,bool& check) {
        if (i<0 || j<0 || i>=col || j>=row || grid[i][j]==1) return ;
        if (i==0 || j==0 || i==col-1 || j==row-1) check=false;
        for (int n=0;n<4;n++) {
            int ni=i+direction[n][0];
            int nj=j+direction[n][1];
            dfs(grid,ni,nj,check);
        }
    }
    int closedIsland(vector<vector<int>>& grid) {
        col=grid.size(),row=grid[0].size();
        int ans=0;
        for (int i=0;i<col;i++) {
            for (int j=0;j<row;j++) {
                bool check=true;
                if (!grid[i][j]) dfs(grid,i,j,check);
                if (check) ans++;
            }
        }
        return ans;
    }
};