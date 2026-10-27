// 来源：LeetCode-Solution《比较含退格的字符串》
// https://leetcode.cn/problems/backspace-string-compare/solutions/bi-jiao-han-tui-ge-de-zi-fu-chuan-by-leetcode-solu/
// 小节：方法一：重构字符串
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool backspaceCompare(string S, string T) {
        return build(S) == build(T);
    }

    string build(string str) {
        string ret;
        for (char ch : str) {
            if (ch != '#') {
                ret.push_back(ch);
            } else if (!ret.empty()) {
                ret.pop_back();
            }
        }
        return ret;
    }
};
