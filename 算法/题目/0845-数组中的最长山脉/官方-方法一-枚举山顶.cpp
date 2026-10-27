// 来源：LeetCode-Solution《数组中的最长山脉》
// https://leetcode.cn/problems/longest-mountain-in-array/solutions/shu-zu-zhong-de-zui-chang-shan-mai-by-leetcode-sol/
// 小节：方法一：枚举山顶
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int longestMountain(vector<int>& arr) {
        int n = arr.size();
        if (!n) {
            return 0;
        }
        vector<int> left(n);
        for (int i = 1; i < n; ++i) {
            left[i] = (arr[i - 1] < arr[i] ? left[i - 1] + 1 : 0);
        }
        vector<int> right(n);
        for (int i = n - 2; i >= 0; --i) {
            right[i] = (arr[i + 1] < arr[i] ? right[i + 1] + 1 : 0);
        }

        int ans = 0;
        for (int i = 0; i < n; ++i) {
            if (left[i] > 0 && right[i] > 0) {
                ans = max(ans, left[i] + right[i] + 1);
            }
        }
        return ans;
    }
};
