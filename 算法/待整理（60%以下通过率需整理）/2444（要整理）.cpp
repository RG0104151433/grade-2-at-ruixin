class Solution {
public:
    long long countSubarrays(vector<int>& nums, int minK, int maxK) {
        long long ans=0;
        // ±éÀúÓÒÎ¬»¤×ó
        int minP=-1,maxP=-1,outsider=-1;
        int len=nums.size();
        for (int i=0;i<len;i++) {
            int n=nums[i];
            if (n==minK) minP=i;
            if (n==maxK) maxP=i;
            if (n<minK || n>maxK) outsider=i;
            ans+=max(0,min(maxP,minP)-outsider);
        }
        return ans;
    }
};
