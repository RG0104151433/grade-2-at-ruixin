// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

//暴力贪心
class Solution {
public:
    int minOperations(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size()!=nums2.size()) {
            if (nums1.size()>nums2.size() && 6*nums2.size()<nums1.size()) return -1;
            if (nums1.size()<nums2.size() && 6*nums1.size()<nums2.size()) return -1;
        }
        int sum1=0,sum2=0;
        for (int i:nums1) sum1+=i;
        for (int i:nums2) sum2+=i;
        if (sum1==sum2) return 0;
        if (sum1>sum2) {
            auto temp=nums1;
            nums1.resize(nums2.size());
            nums1=nums2;
            nums2.resize(temp.size());
            nums2=temp;
        }
        ranges::sort(nums1),ranges::sort(nums2);//不是哥们，真就忘了排序了是吧
        int i=0,j=nums2.size()-1,dif=abs(sum1-sum2),ans=0;
        while (i<nums1.size() && j>=0 && dif>0) {
            int cur=max(abs(6-nums1[i]),abs(nums2[j]-1));
            if (abs(6-nums1[i])>=abs(nums2[j]-1)) i++;
            else j--;
            dif-=cur;
            ans++;
        }
        if (i==nums1.size() && dif>0) {
            while (j>=0 && dif>0) {
                int cur=abs(nums2[j]-1);
                j--;
                dif-=cur;
                ans++;
            }
        }
        else if (j==0 && dif>0) {
            while (i<nums1.size() && dif>0) {
                int cur=abs(6-nums1[i]);
                i++;
                dif-=cur;
                ans++;
            }
        }
        return ans;
    }
};
