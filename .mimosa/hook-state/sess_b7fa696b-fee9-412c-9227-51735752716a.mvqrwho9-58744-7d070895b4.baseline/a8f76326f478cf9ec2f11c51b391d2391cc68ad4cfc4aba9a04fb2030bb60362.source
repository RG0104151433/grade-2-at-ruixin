int cmp(const void* a,const void* b) {return *(int*)a-*(int*)b;}
int getLargestOutlier(int* nums, int numsSize) {
    qsort(nums, numsSize, sizeof (int), cmp);//从小到大进行排序
    long long sum=0;//记录所有数字的和
    int result;
    for (int i=0;i<numsSize; i++) sum+=nums[i];
    for (int i=numsSize-1;i>=0;i--) {//从大到小，确保是最大的异常值
        long long temp=sum-nums[i];//此处为出这个数以外所有数的和
        int src=temp%2==0?temp/2:INT_MAX;//按照题目，必有一个数等于这个和的一半，二分查找
        if (src!=INT_MAX) {//注意排除不合理选项的方法
            int left=0,right=numsSize,find=0;
            while (left<right) {
                int mid=left+(right-left)/2;
                if (nums[mid]<src) left=mid+1;
                else right=mid;
            }//找出的left应该是符合要求的，现在处理不符合的情况
            if (left!=i && nums[left]==src) find=1;
            else {
                if (left==i && i==0 && nums[1]==src) find=1;
                else if (left==i && i==numsSize-1 && nums[numsSize-2]==src) find=1;
                else if (left==i && i!=0 && i!=numsSize-1 && (nums[i-1]==src || nums[i+1]==src)) find=1;
            }//注意这里究竟排除了什么！这里实际上并没有排除所有i取极值的情况
            if (find==1) {
                result=nums[i];
                break;
            }
        }
    }
    return result;
}
