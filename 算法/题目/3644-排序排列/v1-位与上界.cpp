class Solution {
public:
    int sortPermutation(vector<int>& nums) {
        int ans=-1;
        int len=nums.size();
        for (int i=0;i<len;i++) {
            if (nums[i]!=i) {
                ans=ans==-1?i:ans&i;
            }
        }
        return ans==-1?0:ans;
    }
};
