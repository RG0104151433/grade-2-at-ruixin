int minSubArrayLen(int target, int* nums, int numsSize) {
    int sum = 0, left = 0, ans = numsSize+1 ;
    for ( int right = 0; right < numsSize; right++ ) {
        sum += nums[right] ;
        while ( sum >= target ) {
            ans = right - left + 1 < ans ? right - left + 1 : ans ;
            sum -= nums[left] ;
            left++ ;
        }
    }
    return ans > numsSize ? 0 : ans;
}
