double findMaxAverage(int* nums, int numsSize, int k) {
    int i,sum=INT_MIN,temp=0;
    for (i=0;i<numsSize;i++) {
        if (i<k) {
            temp+=nums[i];
        }
        else {
            temp+=(nums[i]-nums[i-k]);
        }
        if (temp>sum && i>=k-1) sum=temp;//注意必须在到达一定程度后再更新ans
    }
    return (double)sum/k;
}
