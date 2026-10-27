// 来源：endlesscheng《O(n) 一次遍历（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/valid-parenthesis-string/solutions/on-yi-ci-bian-li-pythonjavaccgojsrust-by-ydl9/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool checkValidString(string s) {
        int mn = 0, mx = 0; // 未匹配的左括号的个数的最小值和最大值

        for (char ch : s) {
            if (ch == '(') {
                mn++;
                mx++;
            } else if (ch == ')') {
                mn--;
                mx--;
                if (mx < 0) { // 右括号太多了
                    return false;
                }
            } else { // '*'
                mn--; // '*' 改成右括号
                mx++; // '*' 改成左括号
            }
            mn = max(mn, 0); // 未匹配的左括号的个数不能为负
        }

        return mn == 0; // 最终未匹配的左括号的个数能是 0
    }
};
