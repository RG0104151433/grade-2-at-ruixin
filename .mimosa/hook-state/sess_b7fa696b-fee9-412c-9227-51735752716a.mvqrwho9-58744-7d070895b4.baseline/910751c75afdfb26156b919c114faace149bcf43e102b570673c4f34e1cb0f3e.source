long long getDescentPeriods(int* prices, int pricesSize) {
    long long ans=0;
    int cnt=0;
    for (int right=0;right<pricesSize;right++) {
        if (right>0 && prices[right]+1==prices[right-1]) {
            cnt++;
        }
        else {
            cnt=1;
        }
        ans+=cnt;
    }
    return ans;
}
