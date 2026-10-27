/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* numbers, int numbersSize, int target, int* returnSize) {
    int left=0,right=numbersSize-1;
    while (1) {
        int s=numbers[left]+numbers[right];
        if (s==target) {
            *returnSize=2;
            int* ans=malloc(2*sizeof(int));
            ans[0]=left+1;
            ans[1]=right+1;
            return ans;
        }
        else s>target?right--:left++;
    }
}
