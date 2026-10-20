/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* productExceptSelf(int* nums, int numsSize, int* returnSize) {
    *returnSize=numsSize;
    int* copy_l=malloc(sizeof(int)*numsSize);
    int* copy_r=malloc(sizeof(int)*numsSize);
    int left=1,right=1;
    for (int i=0;i<numsSize;i++) {
        copy_l[i]=left;
        copy_r[i]=right;
        left*=nums[i];
        right*=nums[numsSize-1-i];
    }
    for (int i=0;i<numsSize;i++) {
        nums[i]=copy_l[i]*copy_r[i];
    }
    free(copy_r);
    free(copy_l);
    return nums;
}
