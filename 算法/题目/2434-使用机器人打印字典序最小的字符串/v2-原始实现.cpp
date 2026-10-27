class Solution {
public:
    string robotWithString(string s) {
        int len=s.size();//string内置了哪些函数？
        vector<char> suf(len+1);//vector是什么？如何初始化？如何进行操作？
        suf[len]='z';
        for (int i=len-1;i>=0;i--) suf[i]=suf[i+1]<s[i]?suf[i+1]:s[i];
        string ans;
        stack<char> stk;//stack是什么？是stl嘛？如何初始化及操作？
        for (int i=0;i<len;i++) {
            stk.push(s[i]);
            while (!stk.empty() && suf[i+1]>=stk.top()) {
                ans+=stk.top();//对于一个string的+=是什么意思？
                stk.pop();
            }
        }
        return ans;
    }
};
