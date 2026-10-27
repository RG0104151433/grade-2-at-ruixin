long long maxProfit(int* prices, int pricesSize, int* strategy, int strategySize, int k) {
    long long sum=0,temp=0;
    for (int i=0;i<pricesSize;i++) {
        sum+=prices[i]*strategy[i];
    }
    temp=sum;
    for (int i=0;i<k;i++) {
        if (i<k/2) temp-=prices[i]*strategy[i];
        else temp+=(prices[i]-prices[i]*strategy[i]);
    }
    if (temp>sum) sum=temp;
    for (int i=k;i<pricesSize;i++) {
        temp+=(prices[i]*(1-strategy[i])+prices[i-k]*strategy[i-k]-prices[i-k/2]);
        if (temp>sum) sum=temp;
    }
    return sum;
}
