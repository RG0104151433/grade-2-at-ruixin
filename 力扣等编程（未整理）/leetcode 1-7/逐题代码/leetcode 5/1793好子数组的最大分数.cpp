//给你一个整数数组 nums （下标从 0 开始）和一个整数 k 。
//一个子数组 (i, j) 的 分数 定义为 min(nums[i], nums[i+1], ..., nums[j]) * (j - i + 1) 。一个 好 子数组的两个端点下标需要满足 i <= k <= j 。请你返回 好 子数组的最大可能 分数 。
class Solution {
public:
    int maximumScore(vector<int>& nums, int k) {
        int i=k,j=k,ans=nums[k],m=nums[k];
        for (int t=0;t<nums.size()-1;t++) {
            if (j==nums.size()-1 || i>0 && nums[i-1]>nums[j+1]) m=min(m,nums[--i]);
            else m=min(m,nums[++j]);
            ans=max(ans,m*(j-i+1));
        }
        return ans;
    }
};
//可以用栈，也可以像这样双指针
