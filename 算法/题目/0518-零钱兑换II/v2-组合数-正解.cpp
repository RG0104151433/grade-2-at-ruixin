// 说明：本文件由原文件拆出，是作者标注为「组合数（正确）」的那一版。

//注意，上方的是排列数，下方的时组合数，下面的才是正确的
int cmp(const void* a, const void* b) {return *(int*)a - *(int*)b;}
int change(int amount, int* coins, int coinsSize) {
    unsigned long long ans[amount + 1];// 初始化
    for (int i = 0; i <= amount; i++) ans[i] = i==0?1:0;
    qsort(coins, coinsSize, sizeof(int), cmp);
    // 注意：这里硬币循环要在外层，金额循环在内层
    // 这样可以避免重复计数（确保是组合数而不是排列数）
    for (int j = 0; j < coinsSize; j++) {
        for (int i = coins[j]; i <= amount; i++) {
            ans[i] += (long long) ans[i - coins[j]];
        }
    }
    return ans[amount];
}
