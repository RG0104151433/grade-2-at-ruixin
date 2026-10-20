class Solution {
public:
    long long mostPoints(vector<vector<int>>& questions) {
        int len=questions.size();
        vector<long long> dp(len+1,0);
        for (int i=len-1;i>=0;i--) {
            int points=questions[i][0];
            int brainpower=questions[i][1];
            int next=min(len,i+brainpower+1);
            long long skip=dp[i+1];
            long long solve=dp[next]+points;
            dp[i]=max(skip,solve);
        }
        return dp[0];
    }
};
