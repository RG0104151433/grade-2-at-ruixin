// 来源：LeetCode-Solution《K 连续位的最小翻转次数》
// https://leetcode.cn/problems/minimum-number-of-k-consecutive-bit-flips/solutions/k-lian-xu-wei-de-zui-xiao-fan-zhuan-ci-s-bikk/
// 小节：方法二：滑动窗口
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minKBitFlips(vector<int>& nums, int k) {
        int n = nums.size();
        int ans = 0, revCnt = 0;
        for (int i = 0; i < n; ++i) {
            if (i >= k && nums[i - k] > 1) {
                revCnt ^= 1;
                nums[i - k] -= 2; // 复原数组元素，若允许修改数组 nums，则可以省略
            }
            if (nums[i] == revCnt) {
                if (i + k > n) {
                    return -1;
                }
                ++ans;
                revCnt ^= 1;
                nums[i] += 2;
            }
        }
        return ans;
    }
};
