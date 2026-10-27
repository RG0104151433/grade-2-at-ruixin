class Solution {
private:
    vector<int> p;
    int find(int x) {
        if (p[x]!=x) p[x]=find(p[x]);
        return p[x];
    }
public:
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        int n=edges.size();
        p.resize(n);
        for (int i=0;i<n;i++) p[i]=i;
        for (auto& e:edges) {
            int u=e[0]-1;
            int v=e[1]-1;
            int ru=find(u);
            int rv=find(v);
            if (ru == rv) return e;//第一条形成环的边就是答案
            p[ru]=rv;//合并两个集合
        }
        return {};
    }
};
