// 来源：endlesscheng《括号消消乐：三种利用栈的写法，附题单！（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/valid-parentheses/solutions/gua-hao-xiao-xiao-le-san-chong-li-yong-z-2xb3/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
    unordered_map<char, char> mp = {{')', '('}, {']', '['}, {'}', '{'}};
public:
    bool isValid(string s) {
        if (s.length() % 2) { // s 长度必须是偶数
            return false;
        }
        stack<char> st;
        for (char c : s) {
            // mp.contains(c) 用来判断 c 是不是 mp 的一个 key
            if (!mp.contains(c)) { // c 是左括号
                st.push(c); // 入栈
            } else { // c 是右括号
                if (st.empty() || st.top() != mp[c]) {
                    return false; // 没有左括号，或者左括号类型不对
                }
                st.pop(); // 出栈
            }
        }
        return st.empty(); // 所有左括号必须匹配完毕
    }
};
