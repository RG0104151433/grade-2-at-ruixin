class Solution {
private:
    vector<vector<pair<int,int>>> p;
    pair<int,int> find(int i, int j) {//注意这种返回格式
        if (p[i][j]!=make_pair(i,j)) p[i][j]=find(p[i][j].first,p[i][j].second);
        return p[i][j];//注意make_pair和first、second的访问方式
    }
    void merge(int i1,int j1,int i2,int j2) {
        auto root1=find(i1,j1);
        auto root2=find(i2,j2);
        if (root1!=root2) p[root1.first][root1.second]=root2;
    }
public:
    int numIslands(vector<vector<char>>& grid) {
        int row=grid.size(),col=grid[0].size();
        p.resize(row,vector<pair<int,int>>(col));
        for (int i=0;i<row;i++) {
            for (int j=0;j<col;j++) p[i][j]=grid[i][j]=='1'?make_pair(i,j):make_pair(-1,-1);
        }
        for (int i=0;i<row;i++) {
            for (int j=0;j<col;j++) {
                if (grid[i][j]=='0' || i==0 && j==0) continue;
                if (j>0 && grid[i][j-1]=='1') merge(i,j,i,j-1);
                if (i>0 && grid[i-1][j]=='1') merge(i,j,i-1,j);
            }
        }
        int ans=0;
        for (int i=0;i<row;i++) {
            for (int j=0;j<col;j++) {
                if (p[i][j].first==i && p[i][j].second==j) ans++;
            }
        }
        return ans;
    }
};
