// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

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
