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
