//给你一个 正 整数数组 nums 。
//请你求出 nums 中有多少个子数组，满足子数组中 第一个 和 最后一个 元素都是这个子数组中的 最大 值。
class Solution {
public:
    long long numberOfSubarrays(vector<int>& nums) {
        long long ans=nums.size();
        stack<pair<int,int>> stk;
        stk.emplace(INT_MAX,0);
        for (int i:nums) {
            while (i>stk.top().first) stk.pop();
            if (i<stk.top().first) stk.emplace(i,1);
            else ans+=stk.top().second++;
        }
        return ans;
    }
};
//通过维护一个底大顶小的栈，我们可以确保是最大值，而且通过维护其中的出现次数正确添加数量
