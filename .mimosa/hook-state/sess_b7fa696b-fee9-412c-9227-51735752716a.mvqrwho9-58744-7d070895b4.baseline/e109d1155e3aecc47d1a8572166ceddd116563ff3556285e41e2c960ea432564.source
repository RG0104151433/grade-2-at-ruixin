// 来源：LeetCode-Solution《解析布尔表达式》
// https://leetcode.cn/problems/parsing-a-boolean-expression/solutions/jie-xi-bu-er-biao-da-shi-by-leetcode-sol-vmvg/
// 小节：方法一：栈
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool parseBoolExpr(string expression) {
        stack<char> stk;
        int n = expression.size();
        for (int i = 0; i < n; i++) {
            char c = expression[i];
            if (c == ',') {
                continue;
            } else if (c != ')') {
                stk.push(c);
            } else {
                int t = 0, f = 0;
                while (stk.top() != '(') {
                    char val = stk.top();
                    stk.pop();
                    if (val == 't') {
                        t++;
                    } else {
                        f++;
                    }
                }
                stk.pop();
                char op = stk.top();
                stk.pop();
                switch (op) {
                case '!':
                    stk.push(f == 1 ? 't' : 'f');
                    break;
                case '&':
                    stk.push(f == 0 ? 't' : 'f');
                    break;
                case '|':
                    stk.push(t > 0 ? 't' : 'f');
                    break;
                default:
                    break;
                }
            }
        }
        return stk.top() == 't';
    }
};
