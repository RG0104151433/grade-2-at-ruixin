int jump(int* nums, int numsSize) {
    int step=0,end=numsSize-1;
    while (end!=0) {
        int temp=end;
        for (int i=end;i>=0;i--) {
            if (end-i<=nums[i]) temp=i;
        }
        end=temp;
        step++;
    }
    return step;
}
