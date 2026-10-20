int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}
int combinationSum4(int* nums, int numsSize, int target) {
    long long ans[target+1];
    ans[0]=1;
    qsort(nums, numsSize, sizeof (int), cmp);
    for (int i=1;i<=target;i++) {
        if (i<nums[0]) ans[i]=0;
        else {
            int count=0;
            for (int j=0;j<numsSize;j++) {
                if (nums[j]>i) break;
                else count+=ans[i-nums[j]]==0?0:ans[i-nums[j]];
            }
            ans[i]=count;
        }
    }
    return ans[target];
}//这个就是组合数！
