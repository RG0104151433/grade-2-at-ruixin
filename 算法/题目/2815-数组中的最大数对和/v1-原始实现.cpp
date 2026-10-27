int maxSum(int* nums, int numsSize) {
    int dig[numsSize];
    for (int i = 0; i < numsSize; i++) {
        int maxDigit = 0, n = nums[i];  // 重命名局部变量
        while (n != 0) {  // 修复：处理 n=0 的情况
            int digit = n % 10;
            maxDigit = digit > maxDigit ? digit : maxDigit;
            n /= 10;
        }
        dig[i] = maxDigit;
    }
    int max[10][2] = {{0}}, result = 0;  // 保持二维数组名为 max
    for (int i = 0; i < numsSize; i++) {
        int digit = dig[i];
        int current = nums[i];
        if (current > max[digit][0]) {
            max[digit][1] = max[digit][0];
            max[digit][0] = current;
        } 
        else if (current > max[digit][1]) max[digit][1] = current;
    }
    for (int i = 0; i < 10; i++) {
        if (max[i][0] != 0 && max[i][1] != 0) {
            int sum = max[i][0] + max[i][1];
            if (sum > result) result = sum;
        }
    }
    return result == 0 ? -1 : result;
}
