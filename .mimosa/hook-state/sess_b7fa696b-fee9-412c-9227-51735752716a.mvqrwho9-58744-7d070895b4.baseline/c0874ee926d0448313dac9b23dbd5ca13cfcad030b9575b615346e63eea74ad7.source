class Solution {
public:
    vector<int> resultsArray(vector<vector<int>>& queries, int k) {
        vector<int> ans(queries.size(),-1);
        priority_queue<int> pq;
        for (int i=0;i<queries.size();i++) {
            pq.push(abs(queries[i][0])+abs(queries[i][1]));
            if (pq.size()>k) pq.pop();
            if (pq.size()==k) ans[i]=pq.top();//对于每一个位置都要有答案，怎么能加else呢？
        }
        return ans;
    }
};
