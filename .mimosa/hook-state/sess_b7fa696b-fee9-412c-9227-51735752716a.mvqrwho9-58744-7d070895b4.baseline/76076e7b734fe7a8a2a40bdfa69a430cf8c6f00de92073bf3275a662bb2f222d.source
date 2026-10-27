class Solution {
public:
    int minLength(string s) {
        stack<char> stack;
        for (char c:s) {//注意这种循环方式
            if (!stack.empty() && (stack.top()=='A' || stack.top()=='C') && c-stack.top()==1) {
                stack.pop();
            }
            else stack.push(c);
        }
        return stack.size();//注意常见函数，以及加括号
    }
};
