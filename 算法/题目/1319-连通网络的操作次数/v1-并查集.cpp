class Solution {
private:
    vector<int> p;
    int find(int i) {
        if (p[i]!=i) p[i]=find(p[i]);
        return p[i];
    }
public:
    int makeConnected(int n, vector<vector<int>>& connections) {
        int num=connections.size(),ans=0;
        if (num<n-1) return -1;
        p.resize(n);
        for (int i=0;i<n;i++) p[i]=i;
        for (int i=0;i<num;i++) {
            int root1=find(connections[i][0]);
            int root2=find(connections[i][1]);
            if (root1!=root2) p[root1]=root2;
        }//合并逻辑！！！
        for (int i=0;i<n;i++) if (p[i]==i) ans++;
        return ans-1;
    }
};
