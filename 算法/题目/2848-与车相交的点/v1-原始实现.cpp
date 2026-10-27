int numberOfPoints(int** nums, int numsSize, int* numsColSize) {
    int max=0,s=0,result=0;
    for (int i=0;i<numsSize;i++) {
        max=max>nums[i][1]?max:nums[i][1];
    }
    int* diff=calloc(max+2,sizeof(int));
    for (int i=0;i<numsSize;i++) {
        diff[nums[i][0]]++;
        diff[nums[i][1]+1]--;
    }
    for (int i=0;i<max+1;i++) {
        s+=diff[i];
        result+=s>0;
    }
    return result;
}
