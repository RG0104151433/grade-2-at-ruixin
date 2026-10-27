//给你一个整数数组 arr 。将 arr 分割成若干 块 ，并将这些块分别进行排序。之后再连接起来，使得连接的结果和按升序排序后的原数组相同。
//返回能将数组分成的最多块数？
class Solution {
public:
    int maxChunksToSorted(vector<int>& arr) {
        stack<int> stk;
        for (int i:arr) {
            if (stk.empty() || i>stk.top()) stk.push(i);
            else {
                int max=stk.top();
                stk.top();
                while (!stk.empty() && stk.top()>i) stk.pop();
                stk.push(max);
            }
        }
        return stk.size();
    }
};
