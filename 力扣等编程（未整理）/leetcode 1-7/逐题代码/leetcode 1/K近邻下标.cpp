#define MIN(a, b) ((b) < (a) ? (b) : (a))
#define MAX(a, b) ((b) > (a) ? (b) : (a))
int* findKDistantIndices(int* nums, int numsSize, int key, int k, int* returnSize) {
    int* ans = malloc(sizeof(int) * numsSize);
    *returnSize = 0;
    int j = 0;
    for (int i = 0; i < numsSize; i++) {
        if (nums[i] != key) {
            continue;
        }
        j = MAX(j, i - k); // j 至少是 i-k
        while (j <= MIN(i + k, numsSize - 1)) { // j 至多是 i+k，但不能越界
            ans[(*returnSize)++] = j++;
        }
    }
    return ans;
}
