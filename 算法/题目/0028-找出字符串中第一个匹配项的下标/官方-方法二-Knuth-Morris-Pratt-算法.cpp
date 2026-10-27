// 来源：LeetCode-Solution《实现 strStr()》
// https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/solutions/shi-xian-strstr-by-leetcode-solution-ds6y/
// 小节：方法二：$\text{Knuth-Morris-Pratt}$ 算法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int strStr(string haystack, string needle) {
        int n = haystack.size(), m = needle.size();
        if (m == 0) {
            return 0;
        }
        vector<int> pi(m);
        for (int i = 1, j = 0; i < m; i++) {
            while (j > 0 && needle[i] != needle[j]) {
                j = pi[j - 1];
            }
            if (needle[i] == needle[j]) {
                j++;
            }
            pi[i] = j;
        }
        for (int i = 0, j = 0; i < n; i++) {
            while (j > 0 && haystack[i] != needle[j]) {
                j = pi[j - 1];
            }
            if (haystack[i] == needle[j]) {
                j++;
            }
            if (j == m) {
                return i - m + 1;
            }
        }
        return -1;
    }
};
