//给你一个整数数组 nums 和两个整数 firstLen 和 secondLen，请你找出并返回两个无重叠 子数组 中元素的最大和，长度分别为 firstLen 和 secondLen 。长度为 firstLen 的子数组可以出现在长为 secondLen 的子数组之前或之后，但二者必须是无重叠。
int maxSumTwoNoOverlap(int* nums, int numsSize, int firstLen, int secondLen) {
    int firstsum[numsSize],secondsum[numsSize];
    int sumfs=0,sumsf=0,fsleft=0,sfleft=0;
    firstsum[0]=secondsum[0]=nums[0];
    for (int i=1;i<numsSize;i++) {//问题1:处理0、1位置数据
        if (i<firstLen) firstsum[i]=firstsum[i-1]+nums[i];
        else firstsum[i]=firstsum[i-1]+nums[i]-nums[i-firstLen];
        if (i<secondLen) secondsum[i]=secondsum[i-1]+nums[i];
        else secondsum[i]=secondsum[i-1]+nums[i]-nums[i-secondLen];
    }
    for (int i=0;i<numsSize;i++) {//问题2:更新顺序
        if (i>=secondLen+firstLen-1) fsleft=fsleft>firstsum[i-secondLen]?fsleft:firstsum[i-secondLen];//问题3、4:if条件中i的取值；firstsum中i的取值
        sumfs=sumfs>fsleft+secondsum[i]?sumfs:fsleft+secondsum[i];
        if (i>=firstLen+secondLen-1) sfleft=sfleft>secondsum[i-firstLen]?sfleft:secondsum[i-firstLen];
        sumsf=sumsf>sfleft+firstsum[i]?sumsf:sfleft+firstsum[i];
    }//注意更新顺序！！！
    return sumfs>sumsf?sumfs:sumsf;
}
