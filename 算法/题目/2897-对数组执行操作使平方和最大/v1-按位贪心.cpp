class Solution {
public:
    int maxSum(vector<int>& nums, int k) {
        long long mx=1000000007;
        vector<int> cnt(31,0);
        for (int n:nums) {
            for (int i=0;i<31;i++) {
                cnt[i]+=(n>>i)&1;
            }
        }
        long long result=0;
        int ans=0;
        for (int n=0;n<k;n++) {
            for (int i=0;i<31;i++) {
                if (!cnt[i]==0) {
                    ans|=(1LL<<i);
                    cnt[i]--;
                }
            }
            result=(result%mx+((long long)ans*ans)%mx)%mx;
            ans=0;
        }
        return (int)result;
    }
};