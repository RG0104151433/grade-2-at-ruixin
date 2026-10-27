//给定一个整数数组 A，坡是元组 (i, j)，其中  i < j 且 A[i] <= A[j]。这样的坡的宽度为 j - i。找出 A 中的坡的最大宽度，如果不存在，返回 0 。
class Solution {
public:
    int maxWidthRamp(vector<int>& nums) {
        int ans=0;
        vector<int> stk;
        vector<pair<int,int>> cnt;
        for (int i=0;i<nums.size();i++) cnt.emplace_back(nums[i],i);
        ranges::sort(cnt);
        for (int i=cnt.size()-1;i>=0;i--) {
            int n=cnt[i].second;
            while (!stk.empty() && n>stk.back()) stk.pop_back();
            stk.push_back(n);
            if (!stk.empty() && stk[0]-stk.back()>ans) ans=stk[0]-stk.back();
        }
        return ans;
    }
};
