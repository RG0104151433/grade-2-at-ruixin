// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

//此处为正确程序
int longestSubarray(int* nums, int numsSize) {
    int n = 0, left = 0, ans = 0;
    for ( int right = 0; right < numsSize; right++ ) {
        n += 1 - nums[right];
        while (n > 1) {
            n -= 1 - nums[left];
            left++;
        }
        ans = ans > right - left ? ans : right - left ;
    }
    return ans ;
}
