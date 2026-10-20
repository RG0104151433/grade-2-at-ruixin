int cmp(const void* a, const void* b) {return *(int*)a - *(int*)b;}
int deleteAndEarn(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    qsort(nums, numsSize, sizeof(int), cmp);  // 首先进行排序
    // 统计不同数字的个数
    int number = 1;
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] != nums[i-1]) number++;
    }
    // 创建数组存储不同数字及其出现次数
    int* values = malloc(sizeof(int) * number);   // 存储不同的数字
    int* counts = malloc(sizeof(int) * number);   // 存储每个数字的出现次数
    int index = 0;
    // 统计每个数字的出现次数
    counts[0] = 1;
    values[0] = nums[0];
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] == nums[i-1]) counts[index]++;
        else {
            index++;
            values[index] = nums[i];
            counts[index] = 1;
        }
    }
    // 动态规划计算最大点数
    int* dp = malloc(sizeof(int) * number);
    for (int i = 0; i < number; i++) {
        int earn = values[i] * counts[i];  // 选择当前数字可获得的总点数
        if (i == 0) {
            dp[i] = earn;
        } else if (i == 1) {
            if (values[i] == values[i-1] + 1) 
                // 如果当前数字与前一个数字相邻，则不能同时选择
                dp[i] = (earn > dp[i-1]) ? earn : dp[i-1];
            else {
                // 如果不相邻，可以同时选择
                dp[i] = dp[i-1] + earn;
            }
        } else {
            if (values[i] == values[i-1] + 1) dp[i] = (dp[i-1] > dp[i-2] + earn) ? dp[i-1] : dp[i-2] + earn;
            else dp[i] = dp[i-1] + earn;
        }
    }
    int result = dp[number-1];
    // 释放内存
    free(values);
    free(counts);
    free(dp);
    return result;
}
