//给你一个整数数组 nums，有一个大小为 k 的滑动窗口从数组的最左侧移动到数组的最右侧。你只可以看到在滑动窗口内的 k 个数字。滑动窗口每次只向右移动一位。返回 滑动窗口中的最大值 。
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        if (nums.size()==0 || k==0) return {};
        vector<int> ans(nums.size()-k+1);
        deque<int> q;
        for (int i=1-k,j=0;j<nums.size();i++,j++) {
            //已经被单调化处理，遇到值相等直接pop
            if (i>0 && q.front()==nums[i-1]) q.pop_front();
            //维护递减队列
            while (!q.empty() && q.back()<nums[j]) q.pop_back();
            q.emplace_back(nums[j]);
            if (i>=0) ans[i]=q.front();
        }
        return ans;
    }
};
