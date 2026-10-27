int cmp(const void* a,const void* b) {return *(int*) a-*(int*) b;}
int lower(int *arr2, int arr2Size, int target) {
    int left=0,right=arr2Size-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        if (arr2[mid]>=target) right=mid;
        else left=mid+1;
    }
    return arr2[left]>=target?left:arr2Size;
}
int upper(int* arr2, int arr2Size, int target) {
    int left=0,right=arr2Size-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        if (arr2[mid]>target) right=mid;
        else left=mid+1;
    }
    return arr2[left]>target?left:arr2Size;
}
int findTheDistanceValue(int* arr1, int arr1Size, int* arr2, int arr2Size, int d) {
    qsort(arr1, arr1Size, sizeof(int),cmp);
    qsort(arr2, arr2Size, sizeof(int),cmp);
    int ans=0;
    for (int i=0;i<arr1Size;i++) {
        int left=lower(arr2, arr2Size, arr1[i]-d);
        int right=upper(arr2, arr2Size, arr1[i]+d);
        ans+=right-left==0?1:0;
    }
    return ans;
}
