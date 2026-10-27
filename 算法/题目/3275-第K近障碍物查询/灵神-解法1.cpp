// 来源：endlesscheng《最大堆维护前 k 小（Python/Java/C++/Go）》
// https://leetcode.cn/problems/k-th-nearest-obstacle-queries/solutions/zui-da-dui-wei-hu-qian-k-xiao-pythonjava-h15x/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> resultsArray(vector<vector<int>>& queries, int k) {
        vector<int> ans(queries.size(), -1);
        priority_queue<int> pq;
        for (int i = 0; i < queries.size(); i++) {
            pq.push(abs(queries[i][0]) + abs(queries[i][1]));
            if (pq.size() > k) {
                pq.pop();
            }
            if (pq.size() == k) {
                ans[i] = pq.top();
            }
        }
        return ans;
    }
};
