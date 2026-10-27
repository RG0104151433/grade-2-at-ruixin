/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int cmp(const void* a,const void* b) {return *(int*)a-*(int*)b;}
int* answerQueries(int* nums, int numsSize, int* queries, int queriesSize, int* returnSize) {
    *returnSize=queriesSize;
    qsort(nums, numsSize, sizeof(int), cmp);
    int sum[numsSize+1];
    for (int i=0;i<=numsSize;i++) {
        if (i==0) sum[i]=0;
        else sum[i]=sum[i-1]+nums[i-1];
    }
    for (int i=0;i<queriesSize;i++) {
        int left=0,right=numsSize;
        while (left<right) {
            int mid=left+(right-left)/2;
            if (queries[i]>=sum[mid]) left=mid+1;
            else right=mid;
        }
        queries[i]=queries[i]>=sum[numsSize]?numsSize:left-1;
    }
    return queries;
}
