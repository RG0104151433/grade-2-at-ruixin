class Solution {
public:
    string minRemoveToMakeValid(string s) {
        stack<int> stk;
        for (int i=0;i<s.size();i++) {
            if (islower(s[i])) continue;
            if (!stk.empty() && s[i]==')' && s[stk.top()]=='(') stk.pop();
            else stk.push(i);//注意s[i]为字母的情况
        }
        while (!stk.empty()) {
            s.erase(stk.top(),1);
            stk.pop();
        }
        return s;
    }
};
