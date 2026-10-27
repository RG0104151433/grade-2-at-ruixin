int minimumK(int* nums, int numsSize) {
    long long sum=0;
    for (int i=0;i<numsSize;i++) {
        sum+=nums[i]>0?nums[i]:0;
    }
    long long left=1,right=(long long)cbrt(sum)*cbrt(sum)*2;
    while (left<right) {
        long long mid=left+(right-left)/2;
        long long result=0;
        for (int i=0;i<numsSize;i++) {
            result+=(long long)nums[i]>0?(nums[i]%mid==0?nums[i]/mid:nums[i]/mid+1):0;
        }
        if (result>(long long)mid*mid) left=mid+1;
        else right=mid;
    }
    return left;
}
