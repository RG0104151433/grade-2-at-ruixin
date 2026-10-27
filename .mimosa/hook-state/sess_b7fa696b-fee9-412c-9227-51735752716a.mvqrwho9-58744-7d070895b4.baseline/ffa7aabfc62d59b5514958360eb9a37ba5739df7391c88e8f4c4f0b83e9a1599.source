// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

//最初的错误代码
int minKBitFlips(int* nums, int numsSize, int k) {
    int act=0,m=0;
    for (int i=0;i<numsSize;i++) {
        if (i<k) act+=(nums[i]+act)%2==1;
        else {
            m+=(nums[i-k]+m)%2==1;
            if (i+k>numsSize && (nums[i]+act-m)%2==0) return -1;
            act+=(nums[i]+act-m)%2==0;
        }
    }
    return act;
}
