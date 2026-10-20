//2563数对数目
int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}
long long countFairPairs(int* nums, int numsSize, int lower, int upper) {
    qsort(nums, numsSize, sizeof(int), cmp);//对nums进行排序便于二分
    long long ans=0;
    for (int i=numsSize-1;i>0;i--) {//从大到小逐个计数
        int l_left=0,u_left=0,l_right=i-1,u_right=i-1;
        int l_find=lower-nums[i],u_find=upper-nums[i];                                                                       
        while (l_left<l_right) {
            int l_mid=l_left+(l_right-l_left)/2;
            if (nums[l_mid]>=l_find) l_right=l_mid;
            else l_left=l_mid+1;
        }
        if (nums[l_left]<l_find) continue;
        while (u_left<u_right) {
            int u_mid=u_left+(u_right-u_left+1)/2;//此处需要+1
            if (nums[u_mid]<=u_find) u_left=u_mid;
            else u_left=u_mid-1;
        }
        if (nums[u_left]<=u_find) ans+=u_right-l_left+1;
    }
    return ans;
}
int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}

long long countFairPairs(int* nums, int numsSize, int lower, int upper) {
    qsort(nums, numsSize, sizeof(int), cmp);
    long long ans = 0;
    
    for (int i = numsSize-1; i > 0; i--) {
        long long l_find = (long long)lower - nums[i];
        long long u_find = (long long)upper - nums[i];
        
        int l_left = 0, l_right = i-1;
        int u_left = 0, u_right = i-1;
        
        // 查找第一个 >= l_find 的位置
        while (l_left < l_right) {
            int l_mid = l_left + (l_right - l_left) / 2;
            if (nums[l_mid] >= l_find) {
                l_right = l_mid;
            } else {
                l_left = l_mid + 1;
            }
        }
        
        // 检查左边界是否满足条件
        if (nums[l_left] < l_find) {
            continue; // 没有满足条件的左边界
        }
        
        // 查找最后一个 <= u_find 的位置
        while (u_left < u_right) {
            int u_mid = u_left + (u_right - u_left + 1) / 2; // 注意这里 +1
            if (nums[u_mid] <= u_find) {
                u_left = u_mid;
            } else {
                u_right = u_mid - 1;
            }
        }
        
        // 检查右边界是否满足条件
        if (nums[u_left] <= u_find) {
            ans += (u_left - l_left + 1);
        }
    }
    
    return ans;
}
