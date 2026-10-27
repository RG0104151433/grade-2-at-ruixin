// 来源：endlesscheng《倒序遍历（Python/Java/C++/Go）》
// https://leetcode.cn/problems/car-fleet-ii/solutions/dao-xu-bian-li-pythonjavacgo-by-endlessc-49w7/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<double> getCollisionTimes(vector<vector<int>>& cars) {
        vector<double> ans(cars.size(), -1);
        stack<int> st; // 栈底用时长，栈顶用时短
        for (int i = cars.size() - 1; i >= 0; i--) {
            int p = cars[i][0], v = cars[i][1];
            while (!st.empty()) {
                int j = st.top();
                int w = cars[j][1];
                if (v > w) {
                    double t = 1.0 * (cars[j][0] - p) / (v - w);
                    if (ans[j] < 0 || t <= ans[j]) { // 车 i 与车 j 相遇
                        ans[i] = t;
                        break;
                    }
                }
                // 车 j 已合并（删除）
                st.pop();
            }
            st.push(i);
        }
        return ans;
    }
};
