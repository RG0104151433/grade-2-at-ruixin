// 来源：endlesscheng《三种写法：26 个栈+位运算优化（Python/Java/C++/Go）》
// https://leetcode.cn/problems/lexicographically-minimum-string-after-removing-stars/solutions/yong-26-ge-zhan-mo-ni-pythonjavacgo-by-e-mhtn/
// 小节：写法二
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string clearStars(string s) {
        stack<int> stacks[26];
        for (int i = 0; i < s.size(); i++) {
            if (s[i] != '*') {
                stacks[s[i] - 'a'].push(i);
                continue;
            }
            for (auto& st : stacks) {
                if (!st.empty()) {
                    s[st.top()] = '*';
                    st.pop();
                    break;
                }
            }
        }

        erase(s, '*');
        return s;
    }
};
