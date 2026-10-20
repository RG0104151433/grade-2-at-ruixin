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
//正确代码
class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        vector<int> ans(n, 0);
        stack<int> stk;
        int prev = 0;  // 上一个事件发生的时间

        for (const string& log : logs) {
            // 解析 "id:type:timestamp"
            int p1 = log.find(':');
            int p2 = log.find(':', p1 + 1);

            int id = stoi(log.substr(0, p1));
            string type = log.substr(p1 + 1, p2 - p1 - 1);
            int ts = stoi(log.substr(p2 + 1));

            if (type == "start") {
                // 当前栈顶函数从 prev 执行到 ts
                if (!stk.empty()) {
                    ans[stk.top()] += ts - prev;
                }

                stk.push(id);
                prev = ts;
            } else {
                // 当前结束的函数从 prev 执行到 ts，end 时刻包含在内
                ans[stk.top()] += ts - prev + 1;
                stk.pop();

                prev = ts + 1;
            }
        }

        return ans;
    }
};
