class Solution {
public:
    int minCost(vector<vector<int>>& grid) {
        int ans=-1;
        int col=grid.size(),row=grid[0].size();
        vector<vector<vector<int>>> record(col,vector<vector<int>> (row,vector<int> (1024,-1)));
        record[0][0][grid[0][0]]=1;
        int sum=col+row;
        for (int s=1;s<sum-1;s++) {
            for (int i=0;i<min(s+1,col);i++) {
                int j=s-i;
                if (j>=row) continue;
                if (i>0) {
                    for (int k=0;k<1024;k++) {
                        if (record[i-1][j][k]!=-1) {
                            int cur_pos=k ^ grid[i][j];
                            record[i][j][cur_pos]=1;
                        }
                    }
                }
                if (j>0) {
                    for (int k=0;k<1024;k++) {
                        if (record[i][j-1][k]!=-1) {
                            int cur_pos=k ^ grid[i][j];
                            record[i][j][cur_pos]=1;
                        }
                    }
                }
            }
        }
        for (int k=0;k<1024;k++) {
            if (record[col-1][row-1][k]==1) {
                ans=k;
                break;
            }
        }
        return ans;
    }
};
