/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* findClosestElements(int* arr, int arrSize, int k, int x, int* returnSize) {
    *returnSize = k;  // 修正1：返回数组大小为k
    
    int left = 0, right = arrSize - 1;
    int* ans = malloc(k * sizeof(int));
    
    // 修正2：使用正确的双指针缩小范围逻辑
    while (right - left + 1 > k) {
        // 比较左右指针元素与x的距离
        int leftDist = abs(arr[left] - x);
        int rightDist = abs(arr[right] - x);
        
        // 根据题目规则移动指针
        if (rightDist < leftDist) {
            // 右元素更接近，保留右指针区域，左指针右移
            left++;
        } else if (leftDist < rightDist) {
            // 左元素更接近，保留左指针区域，右指针左移
            right--;
        } else {
            // 距离相等时，取较小的元素（即左边的元素）
            right--;
        }
    }
    
    // 修正3：正确填充结果数组
    for (int i = 0; i < k; i++) {
        ans[i] = arr[left + i];
    }
    
    return ans;
}
