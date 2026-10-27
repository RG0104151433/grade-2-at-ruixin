class Solution {
public:
    int singleNonDuplicate(vector<int>& nums) {
        if (nums.size()==1) return nums[0];
        int left=0,right=nums.size()-1,len=nums.size();
        while (left<right) {
            int mid=left+(right-left)/2;
            if (mid>0 && nums[mid-1]==nums[mid]) {
                if ((right-left)%4==0) right=mid-2;
                else left=mid+1;
            }
            else if (mid<nums.size()-1 && nums[mid+1]==nums[mid]) {
                if ((right-left)%4==0) left=mid+2;
                else right=mid-1;
            }
            else return nums[mid];
        }
        return nums[left];
    }
};
