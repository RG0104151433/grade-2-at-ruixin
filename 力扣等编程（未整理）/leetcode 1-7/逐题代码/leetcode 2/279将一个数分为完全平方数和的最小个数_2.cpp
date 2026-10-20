//518 兑换零钱2
int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}
int change(int amount, int* coins, int coinsSize) {
    int ans[amount+1];
    ans[0]=1;
    qsort(coins, coinsSize, sizeof (int), cmp);
    for (int i=1;i<amount+1;i++) {
        if (i<coins[0]) ans[i]=0;
        else {
            int count=0;
            for (int j=0;j<coinsSize;j++) {
                if (coins[j]>i) break;
                else if (ans[i-coins[j]]!=0) count+=ans[i-coins[j]];
            }
            ans[i]=count;
        }
    }
    return ans[amount];
}
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
