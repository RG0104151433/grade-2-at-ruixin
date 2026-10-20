/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* getAverages(int* nums, int numsSize, int k, int* returnSize) {
    int* ans=malloc(numsSize*sizeof(int));
    *returnSize=numsSize;
    long long sum=0;
    for (int i=0;i<numsSize;i++) {
        sum+=nums[i];
        if (i<k || i>=numsSize-k) ans[i]=-1;
        if (i>2*k) sum-=nums[i-2*k-1];
        if (i>=2*k) ans[i-k]=sum/(2*k+1);
    }
    return ans;
}
