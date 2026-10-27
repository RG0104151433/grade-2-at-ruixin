int removeDuplicates(int* nums, int numsSize) {
    int count=1,j=0,length=1;//j用来计数修改后的
    if (numsSize==1) return length;
    for (int i=1;i<numsSize;i++) {//i用来计数遍历原数组的
        if (nums[i]==nums[i-1]) count++;
        else count=1;
        if (count<3) {
            nums[j]=nums[i];
            length++;
            j++;
        }
    }
    return length;
}
