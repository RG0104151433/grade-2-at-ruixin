class Solution {
private:
    vector<int> p;
    int find(int i) {
        if (p[i]!=i) p[i]=find(p[i]);
        return p[i];
    }
public:
    int minSwapsCouples(vector<int>& row) {
        int n=row.size()/2;
        p.resize(n);
        for (int i=0;i<n;i++) p[i]=i;
        for (int i=0;i<n;i++) {
            int l=row[2*i],r=row[2*i+1];
            if ((int)l/2!=(int)r/2) p[find(l/2)]=find(r/2);//注意这个地方的处理方法
        }
        int c=0;
        for (int i=0;i<n;i++) if (find(i)==i) c++;
        return n-c;
    }
};
