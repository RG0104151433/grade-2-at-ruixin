int findMaxConsecutiveOnes(int* nums, int numsSize) {
    int ans=0,cnt=0;
    for (int i=0;i<numsSize;i++) {
        if (nums[i]==1) {
            cnt++;
            ans=ans>cnt?ans:cnt;
        }
        else cnt=0;
    }
    return ans;
}//可以不用计量左右端值的right和left，可以使用cnt
