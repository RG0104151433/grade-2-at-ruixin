int maximumCount(int* nums, int numsSize) {
    if (nums[0]==0 && nums[numsSize-1]==0) return 0;
    int left=0,right=numsSize-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        if (nums[mid]>=0) right=mid;
        else left=mid+1;
    }
    int neg=nums[left]>=0?left:left+1;
    left=0;
    right=numsSize-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        if (nums[mid]>0) right=mid;
        else left=mid+1;
    }
    return (numsSize-left)>neg?(numsSize-left):neg;
}
