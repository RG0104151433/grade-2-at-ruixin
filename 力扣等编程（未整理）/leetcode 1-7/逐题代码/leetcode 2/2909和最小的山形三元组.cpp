//给你一个下标从 0 开始的整数数组 nums 。如果下标三元组 (i, j, k) 满足下述全部条件，则认为它是一个 山形三元组 ：i < j < k；nums[i] < nums[j] 且 nums[k] < nums[j]  请你找出 nums 中 元素和最小 的山形三元组，并返回其 元素和 。如果不存在满足条件的三元组，返回 -1 。
int minimumSum(int* nums, int numsSize) {
    int minl[numsSize], minr[numsSize], result=INT_MAX;
    minl[0]=minr[numsSize-1]=INT_MAX;
    for (int i=1;i<numsSize;i++) {
        minl[i]=minl[i-1]<nums[i-1]?minl[i-1]:nums[i-1];
        minr[numsSize-1-i]=minr[numsSize-i]<nums[numsSize-i]?minr[numsSize-i]:nums[numsSize-i];
    }
    for (int i=1;i<numsSize-1;i++) {
        if (nums[i]>minl[i] && nums[i]>minr[i]) {
            result=result<nums[i]+minl[i]+minr[i]?result:nums[i]+minl[i]+minr[i];
        }
    }
    return result==INT_MAX?-1:result;
}//记录每个位置处左右两边的最小值并在确保一个数小于其两侧的最小值的情况下遍历，依次求和并更新
