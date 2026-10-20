int minimumDeleteSum(char* s1, char* s2) {
    int m=strlen(s1),n=strlen(s2);
    int dp[m+1][n+1];
    dp[0][0]=0;//直接加就行
    for (int i=1;i<=m;i++) dp[i][0]=dp[i-1][0]+s1[i-1];
    for (int j=1;j<=n;j++) dp[0][j]=dp[0][j-1]+s1[j-1];
    for (int i=1;i<m;i++) {
        for (int j=1;j<n;j++) {
            if (s1[i-1]==s2[j-1]) dp[i][j]=dp[i-1][j-1];
            else {
                int min=dp[i-1][j-1]+s1[i-1]+s2[j-1];
                if (dp[i-1][j]+s1[i-1]<min) min=dp[i-1][j]+s1[i-1];
                if (dp[i][j-1]+s2[j-1]<min) min=dp[i][j-1]+s2[j-1];
            }
        }
    }
    return dp[m][n];
}
