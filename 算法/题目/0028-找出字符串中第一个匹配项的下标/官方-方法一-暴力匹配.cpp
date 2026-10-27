// 来源：LeetCode-Solution《实现 strStr()》
// https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/solutions/shi-xian-strstr-by-leetcode-solution-ds6y/
// 小节：方法一：暴力匹配
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int strStr(string haystack, string needle) {
        int n = haystack.size(), m = needle.size();
        for (int i = 0; i + m <= n; i++) {
            bool flag = true;
            for (int j = 0; j < m; j++) {
                if (haystack[i + j] != needle[j]) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                return i;
            }
        }
        return -1;
    }
};
