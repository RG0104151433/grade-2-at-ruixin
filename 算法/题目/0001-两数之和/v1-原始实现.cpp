/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    for (int i = 0; ; i++) { // 枚举 i
        for (int j = i + 1; j < numsSize; j++) { // 枚举 i 右边的 j
            if (nums[i] + nums[j] == target) { // 满足要求
                int* ans = malloc(2 * sizeof(int)); // 分配返回结果的内存空间
                *returnSize = 2; // ans 的长度
                ans[0] = i; // 存储第一个数的下标
                ans[1] = j; // 存储第二个数的下标
                return ans; // 返回结果数组的指针
            }
        }
    }
}
