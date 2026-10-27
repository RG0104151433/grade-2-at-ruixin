// 来源：LeetCode-Solution《检查数组对是否可以被 k 整除》
// https://leetcode.cn/problems/check-if-array-pairs-are-divisible-by-k/solutions/jian-cha-shu-zu-dui-shi-fou-ke-yi-bei-k-zheng-chu-/
// 小节：方法一：按照余数进行统计
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool canArrange(vector<int>& arr, int k) {
        vector<int> mod(k);
        for (int num: arr) {
            ++mod[(num % k + k) % k];
        }
        for (int i = 1; i + i < k; ++i) {
            if (mod[i] != mod[k - i]) {
                return false;
            }
        }
        return mod[0] % 2 == 0;
    }
};
