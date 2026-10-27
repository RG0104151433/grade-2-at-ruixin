// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

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
