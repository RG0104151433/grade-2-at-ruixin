class Solution {
public:
    void sortColors(vector<int>& nums) {
        int p0=0,p1=0;
        for (int i=0;i<nums.size();i++) {
            int n=nums[i];
            nums[i]=2;
            if (n<=1) nums[p1++]=1;
            if (n==0) nums[p0++]=0;
        }
    }
};
