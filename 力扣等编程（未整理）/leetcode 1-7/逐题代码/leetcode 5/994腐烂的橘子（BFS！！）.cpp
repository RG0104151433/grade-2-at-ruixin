class Solution {
private:
    int direction[4][2]={{-1,0},{0,1},{1,0},{0,-1}};
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int num=0,ans=0;
        int col=grid.size(),row=grid[0].size();
        vector<pair<int,int>> q;
        for (int i=0;i<col;i++) {
            for (int j=0;j<row;j++) {
                if (grid[i][j]==1) num++;
                else if (grid[i][j]==2) q.emplace_back(i,j);
            }
        }
        while (!q.empty() && num) {//num应该是一个条件
            ans++;
            auto temp=move(q);//这是一个操作，让q为空并复制到temp
            for (auto& [i,j]:temp) {//auto是个好东西
                for (auto& d:direction) {
                    int c=i+d[0],r=j+d[1];
                    if (c>=0 && c<col && r>=0 && r<row && grid[c][r]==1) {
                        num--;
                        grid[c][r]=2;
                        q.emplace_back(c,r);//找个地方不用方括号
                    }
                }
            }
        }
        return num?-1:ans;
    }
};
