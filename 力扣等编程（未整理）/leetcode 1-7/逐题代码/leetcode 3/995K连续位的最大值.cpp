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
//DS的正确代码
int minKBitFlips(int* nums, int numsSize, int k) {
    int act = 0, m = 0;
    for (int i = 0; i < numsSize; i++) {
        // 有翻转在当前位置结束
        if (i >= k && nums[i - k] >= 2) {
            m++;                    // 结束一次翻转
            nums[i - k] -= 2;       // 恢复原值（可选，不影响后续）
        }
        int cur = (nums[i] % 2 + act - m) % 2;  // 当前实际值
        if (cur == 0) {             // 需要翻转
            if (i + k > numsSize) return -1;    // 剩余长度不够翻转
            act++;
            nums[i] += 2;           // 标记此处开始了一次翻转
        }
    }
    return act;
}//原程序错误的原因是，nums[i]+m不能用来判断是否进行过操作！！
