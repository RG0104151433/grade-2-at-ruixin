class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size()>nums2.size()) swap(nums1,nums2);
        int len1=nums1.size(),len2=nums2.size();
        int half=(len1+len2+1)/2;
        int left=0,right=len1;
        while (left<=right) {
            int i=left+(right-left)/2;
            int j=half-i;
            int L1=(i==0)?INT_MIN:nums1[i-1];
            int L2=(j==0)?INT_MIN:nums2[j-1];
            int R1=(i==len1)?INT_MAX:nums1[i];
            int R2=(j==len2)?INT_MAX:nums2[j];//注意不能全部都加减，且注意len不-1
            if (L1>R2) right=i-1;
            else if (L2>R1) left=i+1;
            else {
                int L=max(L1,L2);
                int R=min(R1,R2);
                if ((len1+len2)%2==0) return (L+R)/2.0;
                else return L;
            }
        }
        return 0.0;
    }
};
