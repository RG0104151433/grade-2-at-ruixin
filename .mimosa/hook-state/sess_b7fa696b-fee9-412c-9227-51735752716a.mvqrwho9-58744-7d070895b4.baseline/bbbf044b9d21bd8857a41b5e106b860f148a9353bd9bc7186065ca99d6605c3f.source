class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int> stk;
        for (auto& s:tokens) {
            if (s.size()==1 && !isalnum(s[0])) {
                int right=stk.top();
                stk.pop();
                int left=stk.top();
                stk.pop();
                if (s[0]=='+') stk.push(right+left);
                else if (s[0]=='-') stk.push(left-right);
                else if (s[0]=='*') stk.push(right*left);
                else if (s[0]=='/') stk.push(left/right);
            }
            else {
                int num=0;
                for (char c:s) {
                    if (isalnum(c)) num=10*num+(c-'0');
                }
                if (s[0]=='-') num*=-1;
                stk.push(num);
            }
        }
        return stk.top();
    }
};
