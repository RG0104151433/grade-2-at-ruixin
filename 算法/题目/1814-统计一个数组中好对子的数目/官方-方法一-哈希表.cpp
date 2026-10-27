// 来源：LeetCode-Solution《统计一个数组中好对子的数目》
// https://leetcode.cn/problems/count-nice-pairs-in-an-array/solutions/tong-ji-yi-ge-shu-zu-zhong-hao-dui-zi-de-ywux/
// 小节：方法一：哈希表
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int countNicePairs(vector<int>& nums) {
        const int MOD = 1000000007;
        int res = 0;
        unordered_map<int, int> h;
        for (int i : nums) {
            int temp = i, j = 0;
            while (temp > 0) {
                j = j * 10 + temp % 10;
                temp /= 10;
            }
            res = (res + h[i - j]) % MOD;
            h[i - j]++;
        }
        return res;
    }
};
