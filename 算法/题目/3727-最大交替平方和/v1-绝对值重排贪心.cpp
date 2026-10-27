class Solution {
public:
    long long maxAlternatingSum(vector<int>& nums) {
        int len=nums.size();
        for (int i=0;i<len;i++) nums[i]=abs(nums[i]);
        sort(nums.begin(),nums.end());
        long long ans=0;
        for (int i=0;i<len;i++) {
            long long cur=(long long)nums[i]*nums[i];
            if (i<len/2) ans-=cur;
            else ans+=cur;
        }
        return ans;
    }
};
// 咱就说这个真的是没什么要写的
// 就是按照绝对值重排一下，排序完贪心一下大的加小的减就行了