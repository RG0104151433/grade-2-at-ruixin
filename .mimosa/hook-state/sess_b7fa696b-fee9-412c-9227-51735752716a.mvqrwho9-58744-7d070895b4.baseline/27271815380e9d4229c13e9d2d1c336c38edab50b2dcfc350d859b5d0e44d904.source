// 来源：LeetCode-Solution《删除字符串两端相同字符后的最短长度》
// https://leetcode.cn/problems/minimum-length-of-string-after-deleting-similar-ends/solutions/shan-chu-zi-fu-chuan-liang-duan-xiang-to-biep/
// 小节：方法一：双指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minimumLength(string s) {
        int n = s.size();
        int left = 0, right = n - 1;
        while (left < right && s[left] == s[right]) {
            char c = s[left];
            while (left <= right && s[left] == c) {
                left++;
            }
            while (left <= right && s[right] == c) {
                right--;
            }
        }
        return right - left + 1;
    }
};
