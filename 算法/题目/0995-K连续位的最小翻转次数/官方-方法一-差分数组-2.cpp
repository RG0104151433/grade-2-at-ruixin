// 来源：LeetCode-Solution《K 连续位的最小翻转次数》
// https://leetcode.cn/problems/minimum-number-of-k-consecutive-bit-flips/solutions/k-lian-xu-wei-de-zui-xiao-fan-zhuan-ci-s-bikk/
// 小节：方法一：差分数组
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minKBitFlips(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> diff(n + 1);
        int ans = 0, revCnt = 0;
        for (int i = 0; i < n; ++i) {
            revCnt ^= diff[i];
            if (nums[i] == revCnt) { // nums[i] ^ revCnt == 0
                if (i + k > n) {
                    return -1;
                }
                ++ans;
                revCnt ^= 1;
                diff[i + k] ^= 1;
            }
        }
        return ans;
    }
};
