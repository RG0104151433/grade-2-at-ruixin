// 来源：endlesscheng《构造 + 严谨证明（Python/Java/C++/Go）》
// https://leetcode.cn/problems/maximum-k-to-sort-a-permutation/solutions/gou-zao-ti-pythonjavacgo-by-endlesscheng-zq8z/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
public:
    int sortPermutation(vector<int>& nums) {
        int ans = -1; // 二进制全为 1
        for (int i = 0; i < nums.size(); i++) {
            int x = nums[i];
            if (i != x) {
                ans &= x;
            }
        }
        return max(ans, 0);
    }
};
