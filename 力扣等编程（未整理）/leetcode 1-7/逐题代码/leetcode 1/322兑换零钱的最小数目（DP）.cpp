int cmp(const void* a,const void*b) {return *(int*)a-*(int*)b;}
int coinChange(int* coins, int coinsSize, int amount) {
    qsort(coins, coinsSize, sizeof(int), cmp);//对硬币数组进行排序
    if (amount<coins[0]) return amount==0?0:-1;//排除不可能完成的情况，同时注意amount=0的情况返回0
    int* ans=malloc(sizeof(int)*(amount+1));//建立动态规划的空间
    for (int i=0;i<=amount;i++) {//对于从0开始的每一个数进行处理
        ans[i]=i==0?0:amount+1;//注意是去最小，那么初始化一个最大的值
        for (int j=0;j<coinsSize;j++) {
            if (coins[j]>i) break;
            //到达一个数的最小步数只由它之前的数的步数决定，那么只需要找出这个数之前的数中可以通过coins到达的当中步数最少的
            else ans[i]=ans[i]>ans[i-coins[j]]+1?ans[i-coins[j]]+1:ans[i];
        }
    }
    int result=ans[amount];
    free(ans);
    return result>amount?-1:result;//返回时注意区分结果究竟是否可行
}
