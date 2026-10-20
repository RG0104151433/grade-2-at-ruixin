bool canArrange(int* arr, int arrSize, int k) {
    int cnt[k];
    for (int i=0;i<k;i++) cnt[i]=0;
    for (int i=0;i<arrSize;i++) cnt[(arr[i]%k+k)%k]++;
    if (cnt[0]%2!=0) return false;
    for (int i=1;i<k;i++) {
        if (cnt[i]!=cnt[k-i]) return false;
    }
    return true;
}
