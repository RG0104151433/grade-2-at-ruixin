int maximumCandies(int* candies, int candiesSize, long long k) {
    int size=0;
    long long sum=0;
    for (int i=0;i<candiesSize;i++) {
        size=candies[i]>size?candies[i]:size;
        sum+=candies[i];
    }
    if (sum<k) return 0;
    int left=1,right=size;
    while (left<right) {
        int mid=left+(right-left+1)/2;//!!!!!!
        long long count=0;
        for (int i=0;i<candiesSize;i++) {
            count+=(long long)candies[i]/mid;
        }
        if (count>=k) left=mid;//!!!!!!
        else right=mid-1;//!!!!!!
    }
    return left;
}
