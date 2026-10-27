int shipWithinDays(int* weights, int weightsSize, int days) {
    int max=0,total=0;
    for (int i=0;i<weightsSize;i++) {
        max=weights[i]>max?weights[i]:max;
        total+=weights[i];
    }
    long left=max,right=total;
    while (left<right) {
        int mid=left+(right-left)/2;//此处的mid讨论的是运载能力
        int count=1,temp=0;//此处count从1开始
        for (int i=0;i<weightsSize;i++) {
            if (temp+weights[i]<=mid) temp+=weights[i];
            else {
                temp=weights[i];
                count++;
            }
        }
        if (count>days) left=mid+1;//注意这里的逻辑
        else right=mid;
    }
    return left;
}
