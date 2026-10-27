//给出一个字符串 s（仅含有小写英文字母和括号）。请你按照从括号内到外的顺序，逐层反转每对匹配括号中的字符串，并返回最终的结果。
//注意，您的结果中 不应 包含任何括号。
class Solution {
public:
    string reverseParentheses(string s) {
        stack<int> stk;  // 存储左括号索引
        for (int i = 0; i < s.size(); i++) {
            if (s[i] == '(') {
                stk.push(i);
            } else if (s[i] == ')') {
                int left = stk.top(); stk.pop();   // 匹配的左括号索引
                // 提取括号内的子串 [left+1, i-1]
                string inner = s.substr(left + 1, i - left - 1);
                reverse(inner.begin(), inner.end()); // 反转内部
                // 将整个括号段（包括括号）替换为反转后的内部字符串
                s.replace(left, i - left + 1, inner);
                // 调整 i 的位置：替换后字符串长度变化，i 指向替换后的最后一个字符
                i = left + inner.size() - 1;
            }
        }
        return s;  // 此时已经没有括号了
    }
};
