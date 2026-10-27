class Solution {
public:
    int maxOperations(vector<int>& nums, int k) {
        int ans=0;
        sort(nums.begin(),nums.end());
        int left=0,right=nums.size()-1;
        while (left<right) {
            if (nums[left]+nums[right]==k) {
                ans++;
                left++;
                right--;
            }
            else if (nums[left]+nums[right]<k) left++;
            else right--;
        }
        return ans;
    }
};