int hIndex(int* citations, int citationsSize) {
    int left=0,right=citationsSize;
    while (left<right) {
        int mid=left+(right-left+1)/2;
        if (citations[citationsSize-mid]<mid) right=mid-1;
        else left=mid;
    }
    return left;
}
