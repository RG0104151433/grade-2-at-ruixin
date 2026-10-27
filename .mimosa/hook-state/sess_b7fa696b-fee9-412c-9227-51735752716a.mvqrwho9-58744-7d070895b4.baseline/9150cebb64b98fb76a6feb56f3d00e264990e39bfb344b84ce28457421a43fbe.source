// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

int longestSubarray(int* nums, int numsSize) {
    int n = 0, left = 0, ans = 0;
    for ( int right = 0; right < numsSize; right++ ) {
        if ( nums[right] == 0 && n == 0 ) n++ ;
        else if ( nums[right] == 0 && n == 1 ) {
            ans = ans > right - left ? ans : right - left ;
            while ( n == 1 ) {
                if ( nums[left] == 0 ) n--;
                left++ ;
            }
        }
    }
    return ans ;
}//不成立的程序
