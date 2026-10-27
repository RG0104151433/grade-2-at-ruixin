class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(),nums.end());
        int len=nums.size();
        vector<vector<int>> ans(0,vector<int> (3));
        for (int i=0;i<len-2;i++) {
            if (i>0 && nums[i]==nums[i-1]) continue;
            int l=i+1,r=len-1;
            while (l<r) {
                if (nums[i]+nums[l]+nums[r]>0) r--;
                else if (nums[i]+nums[l]+nums[r]<0) l++;
                else {
                    ans.push_back({nums[i],nums[l],nums[r]});
                    l++,r--;
                    while (l<r && nums[l]==nums[l-1]) l++;
                    while (l<r && nums[r]==nums[r+1]) r--; // 将去重做在每一次操作中
                }
            }
        }
        return ans;
    }
};
