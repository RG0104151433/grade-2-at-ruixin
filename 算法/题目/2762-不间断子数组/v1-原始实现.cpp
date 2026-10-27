class Solution {
public:
    long long continuousSubarrays(vector<int>& nums) {
        deque<int> mindq;
        deque<int> maxdq;
        int left=0;
        long long ans=0;
        for (int i=0;i<nums.size();i++) {
            while (!mindq.empty() && nums[mindq.back()]>=nums[i]) mindq.pop_back();
            mindq.emplace_back(i);
            while (!maxdq.empty() && nums[maxdq.back()]<=nums[i]) maxdq.pop_back();
            maxdq.emplace_back(i);
            while (nums[maxdq.front()]-nums[mindq.front()]>2) {
                left++;
                while (maxdq.front()<left) maxdq.pop_front();
                while (mindq.front()<left) mindq.pop_front();
            }
            ans+=i-left+1;
        }
        return ans;
    }
};
//与1438不同之处在于这个题要的是数量，而定长内这类数组的数量等于每一次加上长度，即1/2*n^2
