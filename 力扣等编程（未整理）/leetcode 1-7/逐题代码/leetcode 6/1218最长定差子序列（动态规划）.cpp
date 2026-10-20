class Solution {
public:
    int longestSubsequence(vector<int>& arr, int difference) {
        int l=arr.size();
        int mx=INT_MIN,mn=INT_MAX;
        for (int i:arr) mx=max(mx,i),mn=min(mn,i);
        vector<int> hash(mx-mn+1,-1);//以最大值为数组大小则要考虑到数组是从0开始的
        vector<vector<int>> dp(2,vector<int> (l,1));
        dp[0][0]=0,dp[1][0]=1;
        int ans=1;
        hash[arr[0]-mn]=0;//要更新第一个位置
        for (int i=1;i<l;i++) {
            dp[0][i]=max(dp[0][i-1],dp[1][i-1]);
            if (arr[i]-difference>=mn && arr[i]-difference<=mx && hash[arr[i]-mn-difference]!=-1) dp[1][i]=dp[1][hash[arr[i]-mn-difference]]+1;//注意直接arr[i]-difference本身不保证结果在mn~mx范围内
            else dp[1][i]=1;
            ans=max({ans,dp[0][i],dp[1][i]});
            hash[arr[i]-mn]=i;//只有顺序处理同时更新hash才能保证只使用到该位置之前的前驱数字
        }
        return ans;
    }
};
