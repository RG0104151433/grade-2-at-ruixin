// 来源：LeetCode-Solution《数组中的最长山脉》
// https://leetcode.cn/problems/longest-mountain-in-array/solutions/shu-zu-zhong-de-zui-chang-shan-mai-by-leetcode-sol/
// 小节：方法二：枚举山脚
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int longestMountain(vector<int>& arr) {
        int n = arr.size();
        int ans = 0;
        int left = 0;
        while (left + 2 < n) {
            int right = left + 1;
            if (arr[left] < arr[left + 1]) {
                while (right + 1 < n && arr[right] < arr[right + 1]) {
                    ++right;
                }
                if (right < n - 1 && arr[right] > arr[right + 1]) {
                    while (right + 1 < n && arr[right] > arr[right + 1]) {
                        ++right;
                    }
                    ans = max(ans, right - left + 1);
                }
                else {
                    ++right;
                }
            }
            left = right;
        }
        return ans;
    }
};
