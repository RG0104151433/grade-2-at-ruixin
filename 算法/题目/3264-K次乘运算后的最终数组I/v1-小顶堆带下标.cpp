// 说明：本文件从 `1046-最后一块石头的重量/附录-原合集.cpp` 拆出，是 3264 的实现。

//3264经过k次将最小值乘以常数操作后的数组
class Solution {
public:
    vector<int> getFinalState(vector<int>& nums, int k, int multiplier) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> pq;
        for (int i=0;i<nums.size();i++) pq.push({nums[i],i});
        while (k--) {
            auto [val,idx] =pq.top();
            pq.pop();
            nums[idx]=val*multiplier;
            pq.push({nums[idx],idx});
        }
        return nums;
    }
};
