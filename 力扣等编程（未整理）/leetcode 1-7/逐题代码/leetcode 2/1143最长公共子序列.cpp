//给定两个字符串 text1 和 text2，返回这两个字符串的最长 公共子序列 的长度。如果不存在 公共子序列 ，返回 0 。   一个字符串的 子序列 是指这样一个新的字符串：它是由原字符串在不改变字符的相对顺序的情况下删除某些字符（也可以不删除任何字符）后组成的新字符串。   例如，"ace" 是 "abcde" 的子序列，但 "aec" 不是 "abcde" 的子序列。   两个字符串的 公共子序列 是这两个字符串所共同拥有的子序列。
int longestCommonSubsequence(char* text1, char* text2) {
    int len1 = strlen(text1), len2 = strlen(text2);
    
    // 创建动态规划表，大小为 (len1+1) x (len2+1)
    int dp[len1+1][len2+1];
    
    // 初始化第一行和第一列为0
    for (int i = 0; i <= len1; i++) dp[i][0] = 0;
    for (int j = 0; j <= len2; j++) dp[0][j] = 0;
    
    // 填充动态规划表
    for (int i = 1; i <= len1; i++) {
        for (int j = 1; j <= len2; j++) {
            if (text1[i-1] == text2[j-1]) {
                // 字符匹配，长度加1
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                // 字符不匹配，取上方或左方的最大值
                dp[i][j] = dp[i-1][j] > dp[i][j-1] ? dp[i-1][j] : dp[i][j-1];
            }
        }
    }
    
    return dp[len1][len2];
}
