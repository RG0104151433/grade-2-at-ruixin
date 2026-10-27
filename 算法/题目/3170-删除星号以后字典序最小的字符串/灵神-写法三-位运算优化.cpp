// 来源：endlesscheng《三种写法：26 个栈+位运算优化（Python/Java/C++/Go）》
// https://leetcode.cn/problems/lexicographically-minimum-string-after-removing-stars/solutions/yong-26-ge-zhan-mo-ni-pythonjavacgo-by-e-mhtn/
// 小节：写法三：位运算优化
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string clearStars(string s) {
        stack<int> stacks[26];
        uint32_t mask = 0;
        for (int i = 0; i < s.size(); i++) {
            if (s[i] != '*') {
                stacks[s[i] - 'a'].push(i);
                mask |= 1 << (s[i] - 'a'); // 标记第 s[i]-'a' 个栈为非空
            } else {
                int k = countr_zero(mask);
                auto& st = stacks[k];
                s[st.top()] = '*';
                st.pop();
                if (st.empty()) {
                    mask ^= 1 << k; // 标记第 k 个栈为空
                }
            }
        }

        erase(s, '*');
        return s;
    }
};
