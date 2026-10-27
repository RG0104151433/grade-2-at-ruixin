int minDistance(char* word1, char* word2) {
    int m=strlen(word1),n=strlen(word2);
    int dp[m+1][n+1];
    for (int i=0;i<=m;i++) {
        dp[i][0]=i;
    }
    for (int i=0;i<=n;i++) {
        dp[0][i]=i;
    }
    for (int i=1;i<=m;i++) {
        for (int j=1;j<=n;j++) {
            if (word1[i-1]==word2[j-1]) dp[i][j]=dp[i-1][j-1];
            else {
                int min=dp[i-1][j-1];
                if (dp[i-1][j]<min) min=dp[i-1][j];
                if (dp[i][j-1]<min) min=dp[i][j-1];
                dp[i][j]=min+1;
            }
        }
    }
    return dp[m][n];
}
