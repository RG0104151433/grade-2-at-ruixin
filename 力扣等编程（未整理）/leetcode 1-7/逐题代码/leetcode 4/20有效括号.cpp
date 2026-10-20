class Solution {
public:
    bool isValid(string s) {
        int n = s.size();
        if (n % 2 == 1) {
            return false;
        }
        unordered_map<char, char> pairs = {
            {')', '('},
            {']', '['},
            {'}', '{'}
        };
        //这是一个哈希表（unordered_map），将右括号映射到对应的左括号。写成 {')', '('} 表示：键是 )，值是 (。这样当我们遇到右括号时，可以立刻查到它应该匹配哪个左括号。
        stack<char> stk;
        for (char ch: s) {
            if (pairs.count(ch)) {
            //pairs.count(ch) 检查 ch 是否在哈希表中。如果 ch 是右括号（)、]、}），count 返回 1，进入这个分支；否则是左括号，进入 else。
                if (stk.empty() || stk.top() != pairs[ch]) {
                //如果栈顶的左括号 stk.top() 不等于当前右括号期望的匹配值 pairs[ch] → 非法（类型不匹配）。
                    return false;
                }
                stk.pop();
            }
            else {
                stk.push(ch);
            }
        }
        return stk.empty();
    }
};
