class Solution {
public:
    int minMoves2(vector<int>& nums) {
        ranges::sort(nums);
        int len=nums.size();
        int median=0;
        if (len%2==0) median=(nums[len/2]+nums[len/2-1])/2;
        else median=nums[len/2];
        int ans=0;
        for (int n:nums) ans+=abs(n-median);
        return ans;
    }
};
