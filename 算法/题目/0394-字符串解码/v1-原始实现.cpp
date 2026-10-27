class Solution {
public:
    string decodeString(string s) {
        string ans;
        stack<int> stk;//用来记录即将被解码的字符串的重复次数
        stack<int> par;//用来记录与目前右括号配对的左括号的位置
        int len=s.size();
        for (int i=0;i<len;i++) {
            ans.push_back(s[i]);
            if (isdigit(s[i])) {
                int t=s[i]-'0';
                while (i>0 && isdigit(s[i-1])) {
                    t+=stk.top()*10;
                    stk.pop();
                }//注意数字不一定是个位数，因此要算上全部数字
                stk.push(t);
            }
            else if (s[i]=='[') par.push(ans.size());
            else if (s[i]==']') {
                string temp=ans.substr(par.top(),ans.size()-par.top()-1);//记录所需要重复的部分
                string paste;
                for (int j=0;j<stk.top();j++) paste+=temp;//进行若干次重复
                ans.replace(par.top()-2,ans.size()-par.top()+2,paste);//而后进行替换
                //一定要注意起止位置！！！
                par.pop();
                stk.pop();//将使用过的数字和左括号替换掉
            }
        }
        return ans;
    }
};
