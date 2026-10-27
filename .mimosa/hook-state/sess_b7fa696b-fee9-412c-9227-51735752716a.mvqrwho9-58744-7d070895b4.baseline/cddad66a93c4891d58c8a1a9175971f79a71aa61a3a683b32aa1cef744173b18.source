int peakIndexInMountainArray(int* arr, int arrSize) {
    int i=arrSize/2;
    if (arrSize==3) return 1;
    else if (arr[i]>arr[i-1] && arr[i]>arr[i+1]) return i;
    else if (arr[i-1]<arr[i] && arr[i]<arr[i+1]) return peakIndexInMountainArray(arr+i, arrSize-i)+i;
    else return peakIndexInMountainArray(arr, i+1);
}
