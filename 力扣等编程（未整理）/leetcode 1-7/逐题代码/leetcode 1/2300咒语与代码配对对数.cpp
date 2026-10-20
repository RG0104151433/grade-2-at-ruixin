/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}

int* successfulPairs(int* spells, int spellsSize, int* potions, int potionsSize, long long success, int* returnSize) {
    *returnSize=spellsSize;
    
    if (potionsSize == 0) {
        int* result = malloc(spellsSize * sizeof(int));
        for (int i = 0; i < spellsSize; i++) result[i] = 0;
        return result;
    }
    
    qsort(potions, potionsSize, sizeof(int), cmp);
    
    for (int i=0;i<spellsSize;i++) {
        long long target = success / spells[i];
        if (success % spells[i] != 0) target++;
        
        int left=0, right=potionsSize-1;
        
        // 使用 while (left < right) 的二分查找
        while (left < right) {
            int mid = left + (right-left)/2;
            if (potions[mid] >= target) {
                right = mid;  // 满足条件，尝试更小的mid
            } else {
                left = mid + 1;  // 不满足条件，尝试更大的mid
            }
        }
        
        // 循环结束后，left 指向第一个可能的满足条件的位置
        // 但仍需检查是否真的满足条件
        int result = 0;
        if (potions[left] >= target) {
            result = potionsSize - left;
        }
        spells[i] = result;
    }
    return spells;
}
