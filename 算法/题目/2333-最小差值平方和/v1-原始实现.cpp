class Solution {
public:
    long long minSumSquareDiff(vector<int>& nums1, vector<int>& nums2, int k1, int k2) {
        int len=nums1.size();
        vector<int> dif(len,0);
        long long ans=0,sum=0;
        for (int i=0;i<len;i++) {
            dif[i]=abs(nums1[i]-nums2[i]);
            ans+=1LL*dif[i]*dif[i];
            sum+=1LL*dif[i];
        }
        ranges::sort(dif,greater());
        dif.push_back(0);
        long long k=1LL*(k1+k2);
        if (k>=sum) return 0;
        for (int i=0;;i++) {
            long long cur=dif[i];
            int j=i+1;
            ans-=cur*cur;
            long long op=j*(cur-dif[j]);
            if (op<k) {
                k-=op;
                continue;
            }
            cur-=k/j;
            return ans+k%j*(cur-1)*(cur-1)+(j-k%j)*cur*cur;
        }
    }
};
