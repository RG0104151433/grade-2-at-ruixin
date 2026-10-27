// 说明：本文件从 `1046-最后一块石头的重量/附录-原合集.cpp` 拆出，是 2530 自己写的实现。

//2530执行k次将最大值变为对三除结果上取整并加上该值后的最大结果
class Solution {
public:
    long long maxKelements(vector<int>& nums, int k) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,less<pair<int,int>>> pq;
        long long ans=0LL;
        for (int i=0;i<nums.size();i++) pq.push({nums[i],i});
        while (k--) {
            auto [val,idx]=pq.top();
            pq.pop();
            nums[idx]=(val+2)/3;
            pq.push({nums[idx],idx});
            ans+=val;
        }
        return ans;
    }
};//此法新建数组
