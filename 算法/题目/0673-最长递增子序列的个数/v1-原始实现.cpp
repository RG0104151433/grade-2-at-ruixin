int findNumberOfLIS(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int ans[2][numsSize];  // ans[0][i]: 以nums[i]结尾的最长递增子序列长度，ans[1][i]: 以nums[i]结尾的最长递增子序列个数
    int maxLen = 0;        // 全局最长递增子序列长度
    int result = 0;        // 最终结果：最长递增子序列的个数
    for (int i = 0; i < numsSize; i++) {
        ans[0][i] = 1;     // 至少包含自己，长度为1
        ans[1][i] = 1;     // 至少包含自己，个数为1
        // 查找以nums[i]结尾的最长递增子序列
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {// 如果找到更长的递增子序列
                if (ans[0][j] + 1 > ans[0][i]) {
                    ans[0][i] = ans[0][j] + 1;
                    ans[1][i] = ans[1][j];  // 重置计数
                }// 如果找到相同长度的递增子序列
                else if (ans[0][j] + 1 == ans[0][i]) {
                    ans[1][i] += ans[1][j];  // 累加计数
                }
            }
        }// 更新全局最长长度
        if (ans[0][i] > maxLen) {
            maxLen = ans[0][i];
            result = ans[1][i];  // 重置结果计数
        }// 如果找到相同长度的
        else if (ans[0][i] == maxLen) {
            result += ans[1][i];  // 累加结果计数
        }
    }
    return result;
}
