// 说明：本文件从原合集 `1046-最后一块石头的重量/附录-原合集.cpp` 拆出，是 1046 的实现。

//1046选两个最大石头的重量，换成其插值直至只剩下一个，求最后一个的重量
class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> pq;
        for (int i=0;i<stones.size();i++) pq.push(stones[i]);
        while (pq.size()>=2) {
            int x=pq.top();
            pq.pop();
            int y=pq.top();
            pq.pop();
            if (x-y>0) pq.push(x-y);
        }
        return pq.size()==0?0:pq.top();
    }
};
