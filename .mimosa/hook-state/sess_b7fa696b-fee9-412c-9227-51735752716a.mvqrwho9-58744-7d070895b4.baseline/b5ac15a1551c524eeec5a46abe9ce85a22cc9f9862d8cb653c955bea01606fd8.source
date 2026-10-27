class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        //构建邻接表的模板
        int e=times.size(),ans=0;
        vector<vector<pair<int,int>>> g(n+1);
        for (int i=0;i<e;i++) {
            int from=times[i][0],to=times[i][1],t=times[i][2];
            g[from].push_back({to,t});
        }
        //进行Dijkstra操作的模板
        vector<int> dist(n+1,INT_MAX);
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
        dist[k]=0;
        pq.push({0,k});
        while (!pq.empty()) {
            auto [d,n]=pq.top();
            pq.pop();
            if (d>dist[n]) continue;
            for (auto [u,v]:g[n]) {
                if (dist[n]+v<dist[u]) {
                    dist[u]=dist[n]+v;
                    pq.push({dist[u],u});
                }
            }
        }
        for (int i=1;i<=n;i++) {
            if (dist[i]==INT_MAX) return -1;
            else ans=max(ans,dist[i]);
        }
        return ans;
    }
};
