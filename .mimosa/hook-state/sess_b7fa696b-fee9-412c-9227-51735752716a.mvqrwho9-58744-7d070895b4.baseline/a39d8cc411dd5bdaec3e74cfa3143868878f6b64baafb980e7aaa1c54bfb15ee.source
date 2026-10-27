//给你一个整数数组 nums，nums 是 严格递增 的。
//对于每个下标 x，设 closest(x) 为使得 abs(nums[x] - nums[y]) 最小化 的 相邻下标。如果两个 相邻 下标的差值相同，则选择 较小 的下标。
//从任意下标 x 出发，你可以通过以下两种方式移动：
//• 移动到任意下标 y，代价为 abs(nums[x] - nums[y])，或者
//• 移动到 closest(x)，代价为 1。
//同时给你一个二维整数数组 queries，其中每个 queries[i] = [li, ri]。
//对于每个查询，计算从下标 li 移动到下标 ri 的 最小总代价。
//返回一个整数数组 ans，其中 ans[i] 是第 i 个查询的答案。
int* minCost(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
    int ltr[numsSize-1], rtl[numsSize-1], preltr[numsSize], prertl[numsSize];
    int closest[numsSize];
    closest[0] = 1;// 计算 closest 下标
    closest[numsSize-1] = numsSize-2;
    for (int i = 1; i < numsSize-1; i++) {
        if (abs(nums[i]-nums[i-1]) <= abs(nums[i+1]-nums[i])) closest[i] = i-1;
        else closest[i] = i+1;
    }
    for (int i = 0; i < numsSize-1; i++) {// 计算 ltr 和 rtl
        if (closest[i] == i+1) ltr[i] = 1;
        else ltr[i] = abs(nums[i+1]-nums[i]);
        if (closest[i+1] == i) rtl[i] = 1;
        else rtl[i] = abs(nums[i+1]-nums[i]);
    }
    preltr[0] = 0;// 前缀和
    for (int i = 1; i < numsSize; i++) preltr[i] = preltr[i-1] + ltr[i-1];
    prertl[numsSize-1] = 0;
    for (int i = numsSize-2; i >= 0; i--) prertl[i] = prertl[i+1] + rtl[i];
    *returnSize = queriesSize;// 处理查询
    int* result = (int*)malloc(sizeof(int) * queriesSize);
    for (int i = 0; i < queriesSize; i++) {
        int l = queries[i][0], r = queries[i][1];
        if (l == r) result[i] = 0;
        else if (l < r) result[i] = preltr[r] - preltr[l];
        else result[i] = prertl[r] - prertl[l];
    }
    return result;
}
