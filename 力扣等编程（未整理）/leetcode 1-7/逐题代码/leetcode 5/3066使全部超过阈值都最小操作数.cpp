class Solution {
public:
    int minOperations(vector<int>& nums, int k) {
        priority_queue<long long,vector<long long>,greater<long long>> pq;
        for (int num:nums) pq.push((long long)num);
        int ans=0;
        while (pq.size()>1 && pq.top()<(long long)k) {
            long long x=pq.top();
            pq.pop();
            long long y=pq.top();
            pq.pop();
            long long val=2*min(x,y)+max(x,y);
            pq.push(val);
            ans++;
        }
        return ans;
    }
};
//关键问题在于对于接近int类型极限的数，按要求操作后会变成复数，导致多一次操作
