// 来源：endlesscheng《简单题，简单做（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/longest-common-prefix/solutions/jian-dan-ti-jian-dan-zuo-pythonjavaccgoj-478q/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        string& s0 = strs[0];
        for (int j = 0; j < s0.size(); j++) { // 从左到右
            for (string& s : strs) { // 从上到下
                if (j == s.size() || s[j] != s0[j]) { // 这一列有字母缺失或者不同
                    return s0.substr(0, j); // 0 到 j-1 是公共前缀
                }
            }
        }
        return s0;
    }
};
