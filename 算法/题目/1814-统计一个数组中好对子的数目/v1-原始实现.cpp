int countNicePairs(int* nums, int numsSize) {
    int use[numsSize];
    long long cnt[numsSize];
    //对每一个数，将式子转化为其与自己转置的差值。得到use数组中的值
    for (int i=0;i<numsSize;i++) {
        int temp=0,n=nums[i];
        while (n!=0) {
            temp=(n%10)+temp*10;
            n/=10;
        }
        use[i]=nums[i]-temp;
    }
    cnt[0]=0;//只要找出一个数之前的数中与之匹配的数字个数即可
    for (int i=0;i<numsSize;i++) {
        cnt[i]=0;
        for (int j=i;j>=0;j--) {
            if (use[j]==use[i] && i!=j) {
                cnt[i]+=cnt[j]+1;//若与这一个可以匹配则可以与前面每一个匹配，那么在此基础上+1
                break;
            }
        }
    }
    int result=0;
    for (int i=0;i<numsSize;i++) {
        result=(result+cnt[i])%1000000007;
    }
    return result;
}
//给你一个数组 nums ，数组中只包含非负整数。定义 rev(x) 的值为将整数 x 各个数字位反转得到的结果。比方说 rev(123) = 321 ， rev(120) = 21 。我们称满足下面条件的下标对 (i, j) 是 好的 ：0 <= i < j < nums.length  nums[i] + rev(nums[j]) == nums[j] + rev(nums[i])  请你返回好下标对的数目。由于结果可能会很大，请将结果对 109 + 7 取余 后返回。
