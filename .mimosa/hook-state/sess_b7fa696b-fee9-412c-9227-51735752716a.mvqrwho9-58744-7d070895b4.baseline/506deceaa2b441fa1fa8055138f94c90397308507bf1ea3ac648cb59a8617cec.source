class Solution {
public:
    int hIndex(vector<int>& citations) {
        int len=citations.size();
        vector<int> cnt(len+1,0);
        
        // 注意到，对于一个大于len的citations[i]，其实其具体数字的价值和len没有区别
        // 第一步：计数（截断到n）
        for (int x : citations)
            cnt[min(x, n)]++;
        
        // 第二步：从高到低累加，找第一个满足条件的h
        int sum=0;
        for (int h=n;h>=0;h--) {
            sum+=cnt[h];
            if (sum>=h) return h;
        }
        return 0;  // 实际上永远不会走到这里
    }
};