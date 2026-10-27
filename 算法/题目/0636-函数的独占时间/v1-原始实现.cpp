// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

//错误代码
class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        stack<pair<int,int>> stk;
        vector<int> t(n,0);
        for (auto& s:logs) {
            int num=0,time=0;
            bool isnum=true,isstart=true;
            for (char c:s) {
                if (isalnum(c) && isnum) num=10*num+(c-'0');
                if (isalnum(c) && !isnum) time=10*time+(c-'0');
                if (islower(c)) {
                    isnum=false;
                    if (c=='e') isstart=false;
                }
            }//重复造轮子
            if (isstart && (stk.empty() || !stk.empty() && num!=stk.top().first)) {
                int begin=stk.top().second;
                stk.top().second=time-begin+1;
                stk.push({num,time});
            }
            else if (!isstart){
                int begin=stk.top().second;
                stk.top().second=time-begin+1;
            }
            while (!stk.empty()) {
                t[stk.top().first]+=stk.top().second;
                stk.pop();
            }
        }
        return t;
    }
};
