class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int> stk;
        for (string c:tokens) {
            if (c=="+" || c=="-" || c=="*" || c=="/") {
                //tokens中的每一项其实是一个string，所以要用双引号和stoi函数
                int op2=stk.top();
                stk.pop();
                int op1=stk.top();
                stk.pop();
                char op=c[0];
                switch (op) {
                    case '+': stk.push(op1+op2); break;
                    case '-': stk.push(op1-op2); break;
                    case '*': stk.push(op1*op2); break;
                    case '/': stk.push(op1/op2); break;
                }
            }
            else stk.push(stoi(c));
        }
        return stk.top();
    }
};
