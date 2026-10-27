class Solution {
public:
    string removeKdigits(string num, int k) {
        if (num.size()==k) return "0";
        stack<int> stk;
        int op=0;
        for (int i=0;i<num.size();i++) {
            while (!stk.empty() && num[stk.top()]>num[i] && op<k) {
                op++;
                num.erase(stk.top(),1);
                i--;
                stk.pop();
            }
            stk.push(i);
        }
        if (op<k) num.erase(num.size()-(k-op),k-op);
        while (num[0]=='0') num.erase(0,1);
        if (num.empty()) return "0";
        return num;
    }
};
