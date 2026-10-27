class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        stack<int> stk;
        int len=temperatures.size();
        for (int i=0;i<len;i++) {
            if (i==0 || temperatures[i]<temperatures[stk.top()]) stk.push(i);
            else {
                while (!stk.empty() && temperatures[i]>temperatures[stk.top()]) {
                    temperatures[stk.top()]=stk.top()-i;
                    stk.pop();
                }
                stk.push(i);
            }
        }
        for (int i=0;i<len;i++) {
            if (temperatures[i]<0) temperatures[i]*=(-1);
            else temperatures[i]=0;
        }
        return temperatures;
    }
};
