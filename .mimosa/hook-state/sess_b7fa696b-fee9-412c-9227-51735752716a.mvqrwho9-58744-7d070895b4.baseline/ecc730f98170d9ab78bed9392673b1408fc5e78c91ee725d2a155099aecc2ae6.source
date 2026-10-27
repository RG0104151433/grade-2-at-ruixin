//给定一个大小为 n 的数组 nums ，返回其中的多数元素。多数元素是指在数组中出现次数 大于 ⌊ n/2 ⌋ 的元素。
int majorityElement(int* nums, int numsSize) {
    int x=0,vote=0;
    for (int i=0;i<numsSize;i++) {
        if (vote==0) x=nums[i];
        vote+=nums[i]==x?1:-1;
    }
    return x;
}
//思路为：如果有一个占多数的数字，那么
