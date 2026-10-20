/* 解法2, 单调栈解法 */
bool find132pattern(int* nums, int numsSize){
    if (numsSize < 3) {
        return false;
    }
    int min[numsSize];
    int stack[numsSize];
    int top = 0;
    int i, j, num;
    
    /* 维护[0,j-1]区间的最小值, 即题目要求的1 */
    min[0] = nums[0];
    for (i = 1; i < numsSize; i++) {
        min[i] = fmin(nums[i], min[i - 1]);
    }
    
    /* 使用单调栈去找3, 单调递减栈, 小数出栈 */
    for (j = numsSize - 1; j >= 1; j--) {
        num = INT_MIN;
        while (top > 0 && nums[j] > stack[top - 1]) {
            num = stack[--top];  /* 出栈元素3为小于a[j]的最大值 */
        }
        if (num > min[j]) {      /* 如果3大于1, 则返回true */
            return true;
        }
        stack[top++] = nums[j];
    }
    return false;
}
