// 来源：endlesscheng《简单题，简单做（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/valid-palindrome/solutions/jian-dan-ti-jian-dan-zuo-pythonjavaccgoj-1za0/
// 小节：算法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isPalindrome(string s) {
        int i = 0, j = s.size() - 1;
        while (i < j) {
            if (!isalnum(s[i])) {
                i++;
            } else if (!isalnum(s[j])) {
                j--;
            } else if (tolower(s[i]) == tolower(s[j])) {
                i++;
                j--;
            } else {
                return false;
            }
        }
        return true;
    }
};
