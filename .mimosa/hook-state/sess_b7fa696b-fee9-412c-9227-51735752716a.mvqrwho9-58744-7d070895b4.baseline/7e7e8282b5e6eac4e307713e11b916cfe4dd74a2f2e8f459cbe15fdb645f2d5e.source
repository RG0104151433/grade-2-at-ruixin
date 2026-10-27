// 说明：本文件由原文件拆出，是作者标注为「排列数（错误）」的那一版。

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
