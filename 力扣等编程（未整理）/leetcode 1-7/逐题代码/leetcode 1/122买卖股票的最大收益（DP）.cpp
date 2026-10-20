int maxProfit(int* prices, int pricesSize) {
    int dp0=0,dp1=-prices[0];
    for (int i=1;i<pricesSize;i++) {
        int newdp0=dp0>dp1+prices[i]?dp0:dp1+prices[i];
        int newdp1=dp1>dp0-prices[i]?dp1:dp0-prices[i];
        dp0=newdp0;
        dp1=newdp1;
    }
    return dp0;
}
//此题使用动态规划十分简便
//思想就是，某一天的收益，只由前一天的情况决定。对于任意前一天的确定收益，都可以反推出当天的情况，具体如下
//首先明确，每一天均处于两种情况之一：手中有和没有股票
//对于某一天，如果手中没有股票，那收益等于前一天没有股票的收益或前一天有股票但是这一天卖出。而后取最大值即可
//同理，如果手中有股票，那收益等于前一天也有股票的收益或前一天没有股票但是今天买入。而后也是取最大值
