// 在未排序数组中找到数字连续的最长序列，要求O(n)时间复杂度——灵神题解
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> record(nums.begin(),nums.end());
        int ans=0;
        for (int i:record) {
            // 按照灵神的思路，这里的关键在于找到一个连续序列的起点
            if (record.contains(i-1)) continue;
            int next=i+1;
            while (record.contains(next)) next++;
            ans=max(ans,next-i);
        }
        return ans;
    }
};
