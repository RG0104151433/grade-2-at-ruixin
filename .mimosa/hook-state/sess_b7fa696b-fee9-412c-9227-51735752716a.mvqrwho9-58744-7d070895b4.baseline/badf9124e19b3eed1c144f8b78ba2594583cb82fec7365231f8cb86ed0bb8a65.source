//给你一个下标从 0 开始的整数数组 nums。请你从所有满足 i < j < k 的下标三元组 (i, j, k) 中，找出并返回下标三元组的最大值。如果所有满足条件的三元组的值都是负数，则返回 0 。下标三元组 (i, j, k) 的值等于 (nums[i] - nums[j]) * nums[k] 。
long long maximumTripletValue(int* nums, int numsSize) {
    int maxi=0,maxsub=0;
    long long ans=0;
    for (int k=0;k<numsSize;k++) {
        ans=ans>(long long)maxsub*nums[k]?ans:(long long)maxsub*nums[k];
        maxsub=maxsub>maxi-nums[k]?maxsub:maxi-nums[k];
        maxi=maxi>nums[k]?maxi:nums[k];
    }
    return ans;
}
//本题本质还是枚举右维护左，但是是扩展到三元情况下的
//在这个题中，nums[i]，两数之差，三元组值这三个数需要在递推中不断更新，同时要注意更新顺序
//在以最右边乘数为枚举对象的同时，不断维护前段两个值
