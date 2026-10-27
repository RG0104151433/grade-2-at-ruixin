//一个整数数组 nums ，和一个表示限制的整数 limit，请你返回最长连续子数组的长度，该子数组中的任意两个元素之间的绝对差必须小于或者等于 limit。
class Solution {
public:
    int longestSubarray(vector<int>& nums, int limit) {
        deque<int> mindq,maxdq;
        int left=0,ans=1;
        for (int i=0;i<nums.size();i++) {
            int n=nums[i];
            while (!mindq.empty() && nums[mindq.back()]>n) mindq.pop_back();
            while (!maxdq.empty() && nums[maxdq.back()]<n) maxdq.pop_back();
            mindq.emplace_back(i);
            maxdq.emplace_back(i);
            //进行该数之前的最大最小的入栈操作
            while (nums[maxdq.front()]-nums[mindq.front()]>limit) {
                left++;
                if (mindq.front()<left) mindq.pop_front();
                if (maxdq.front()<left) maxdq.pop_front();
            }
            //一种类贪心做法，一次次增大left直到找到left到i之间最值符合要求的位置
            ans=max(ans,i-left+1);
        }
        return ans;
    }
};
