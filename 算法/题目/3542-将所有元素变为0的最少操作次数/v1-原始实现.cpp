class Solution {
public:
    int minOperations(vector<int>& nums) {
        stack<int> stk;
        int ans=0;
        for (int i:nums) {
            while (!stk.empty() && i<stk.top()) {
                stk.pop();
                ans++;
            }
            if ((stk.empty() || stk.top()!=i) && i!=0) stk.push(i);
        }
        return ans+stk.size();
    }
};
