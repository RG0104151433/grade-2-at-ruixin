int longestOnes(int* nums, int numsSize, int k) {
    int ans=0, left=0, sum=0;
    for (int right=0; right<numsSize; right++) {
        sum+=1-nums[right];//就是0的个数
        while (sum>k) {//在0的数量依旧大于k时
            sum-=1-nums[left];//在不断减少0的数量，这样可以简便判断
            left++;
        }
        ans=right-left+1>ans?right-left+1:ans;
    }
    return ans;
}
