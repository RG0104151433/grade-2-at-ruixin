/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int lowerBound(int* nums, int numsSize, int target) {
    int left = 0, right = numsSize - 1; // 移除外部 mid 初始化
    while (left <= right) {
        int mid = left + (right - left) / 2; // 修正 mid 计算，避免溢出
        if (nums[mid] >= target) { // 移除不必要的 mid>0 条件
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return left; // 返回第一个大于或等于 target 的索引
}

int* searchRange(int* nums, int numsSize, int target, int* returnSize) {
    int *ans = malloc(2 * sizeof(int));
    ans[0] = -1;
    ans[1] = -1;
    *returnSize = 2;

    int start = lowerBound(nums, numsSize, target);
    // 添加边界检查：如果 start 越界或 nums[start] 不等于 target，则未找到
    if (start == numsSize || nums[start] != target) {
        return ans;
    } else {
        int end = lowerBound(nums, numsSize, target + 1) - 1; // 计算结束位置
        ans[0] = start;
        ans[1] = end;
    }
    return ans;
}
