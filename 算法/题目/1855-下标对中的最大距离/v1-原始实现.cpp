//给两个非递增数组，需要给出满足nums1[i]<=nums2[j] && i<=j的数组的最大长度，即j-i的最大值
int maxDistance(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    int ans=0,i=0;
    for (int j=0;j<nums2Size;j++) {
        while (i<=j && i<nums1Size && nums1[i]>nums2[j]) i++;//注意此处并不是都写上就行了，这些判断是有顺序的
        if (i<=j && i<nums1Size && nums1[i]<=nums2[j]) ans=j-i>ans?j-i:ans;
    }
    return ans;
}
