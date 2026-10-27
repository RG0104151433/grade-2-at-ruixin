class Solution {
public:
    string removeOuterParentheses(string s) {
        string ans;
        stack<char> stk;
        int left=0,right;
        for (int i=0;i<s.size();i++) {
            if (!stk.empty() && s[i]==')' && stk.top()=='(') stk.pop();
            else stk.push(s[i]);
            if (stk.empty()) {
                right=i;
                ans+=s.substr(left+1,right-left-1);
                left=right+1;
            }
        }
        return ans;
    }
};
