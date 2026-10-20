int removeDuplicates(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int slow = 0;  // 慢指针：指向当前唯一元素的最后一个位置
    for (int fast = 1; fast < numsSize; fast++) {
        // 如果发现新元素
        if (nums[fast] != nums[slow]) {
            slow++;  // 慢指针先移动
            nums[slow] = nums[fast];  // 更新为新的唯一元素
        }
    }
    return slow + 1;  // 返回唯一元素的个数
}
int removeDuplicates(int* nums, int numsSize) {
    int k = 1;
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] != nums[i - 1]) { // nums[i] 不是重复项
            nums[k++] = nums[i]; // 保留 nums[i]
        }
    }
    return k;
}
