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
//解法二：优化，桶计数
class Solution {
public:
    int minOperations(vector<int>& nums1, vector<int>& nums2) {
        int sum1 = accumulate(nums1.begin(), nums1.end(), 0);
        int sum2 = accumulate(nums2.begin(), nums2.end(), 0);

        if (sum1 == sum2) return 0;
        if (sum1 > sum2) {
            swap(nums1, nums2);
            swap(sum1, sum2);   // 保证 sum1 <= sum2
        }

        int n = nums1.size(), m = nums2.size();
        // 不可能的情况：两个数组总和范围没有交集
        if (6 * n < m || 6 * m < n) return -1;

        int diff = sum2 - sum1;          // 需要缩小的差值
        vector<int> cnt1(7, 0), cnt2(7, 0);
        for (int x : nums1) cnt1[x]++;
        for (int x : nums2) cnt2[x]++;

        int ans = 0;
        // 贡献从大到小枚举
        for (int d = 5; d >= 1; --d) {
            // nums1 中数字 6-d 可以增加 d
            int c1 = cnt1[6 - d];
            // nums2 中数字 d+1 可以减小 d
            int c2 = cnt2[d + 1];
            int total = c1 + c2;
            if (total == 0) continue;

            // 需要多少个这样的操作才能把 diff 削到 ≤0
            int need = (diff + d - 1) / d;   // 上取整
            int take = min(total, need);
            ans += take;
            diff -= take * d;
            if (diff <= 0) return ans;
        }
        return -1;   // 理论上不会执行（因为之前已判断可行）
    }
};
