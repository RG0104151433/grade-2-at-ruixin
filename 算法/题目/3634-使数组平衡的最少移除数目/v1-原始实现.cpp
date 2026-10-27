int cmp(const void* a, const void* b) {
    return *(int*)a - *(int*)b;
}//此为从小到大，反之为从大到小
int minRemoval(int* nums, int numsSize, int k) {//思路上就是不从外向答案压，而是让两指针往答案方向扩展
    qsort(nums, numsSize, sizeof(int), cmp);//标准的qsort使用方式：数组，数组大小，数组元素大小，标准的函数->就是说要背过那个cmp函数
    int ans=numsSize, right=0;
    for (int left=0; left<numsSize; left++) {
        while (right<numsSize && (long long)nums[right]<=(long long)nums[left]*k) right++;//在一个left下让right合理地外扩
        ans=numsSize-right+left<ans?numsSize-right+left:ans;//重视使用三元符
    }
    return ans;
}
