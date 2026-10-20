int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}
int smallestDivisor(int* nums, int numsSize, int threshold) {
    qsort(nums, numsSize, sizeof(int), cmp);
    long long sum=numsSize;
    for (int i=0;i<numsSize;i++) {sum+=nums[i];}
    long long left=1,right=sum;
    while (left<right) {
        long long mid=left+(right-left)/2;
        long long result=0;
        for (int i=0;i<numsSize;i++) {
            result+=nums[i]%mid==0?nums[i]/mid:nums[i]/mid+1;
        }
        if (result<=threshold) right=mid;
        else left=mid+1;
    } 
    return left;
}
