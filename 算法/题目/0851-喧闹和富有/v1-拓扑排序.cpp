//通过richer数组说明前一个比后一个富有，组成一个关系图
//结果输出不必该人穷的人中最吵闹的人的编号
class Solution {
public:
    vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {
        int n=quiet.size();
        vector<vector<int>> g(n);
        vector<int> indeg(n, 0);
        for (auto &e:richer) {
            g[e[0]].push_back(e[1]);
            indeg[e[1]]++;
        }
        queue<int> q;
        vector<int> ans(n);
        for (int i=0;i<n;i++) {
            ans[i]=i;//关键：默认指向自己
            if (indeg[i]==0) q.push(i);
        }
        while (!q.empty()) {
            int u=q.front();
            q.pop();
            for (int v:g[u]) {//u比v有钱，如果u的答案比v当前答案更安静，就更新v
                if (quiet[ans[u]]<quiet[ans[v]]) ans[v]=ans[u];
                if (--indeg[v]==0) q.push(v);
            }
        }
        return ans;
    }
};
