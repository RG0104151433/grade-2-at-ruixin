// 说明：本文件从 `1046-最后一块石头的重量/附录-原合集.cpp` 拆出，是 2558 的实现。

//2558经过k次将最大值变为其根值操作后的总数
class Solution {
public:
    long long pickGifts(vector<int>& gifts, int k) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,less<pair<int,int>>> pq;
        for (int i=0;i<gifts.size();i++) pq.push({gifts[i],i});
        while (k--) {
            auto [val,idx] = pq.top();
            gifts[idx]=(int)sqrt(val);
            pq.pop();
            pq.push({gifts[idx],idx});
        }
        long long ans=0;
        for (int i:gifts) ans+=i;
        return ans;
    }
};
