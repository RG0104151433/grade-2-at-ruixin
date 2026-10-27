// 来源：endlesscheng《贪心 + 前缀和（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-cost-to-move-between-indices/solutions/tan-xin-qian-zhui-he-pythonjavacgo-by-en-0fe7/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> minCost(vector<int>& nums, vector<vector<int>>& queries) {
        int n = nums.size();
        vector<int> sum_l(n); // sum_l[i] 等于从 i 移动到 0 的代价和
        vector<int> sum_r(n); // sum_r[i] 等于从 0 移动到 i 的代价和
        for (int i = 1, cost; i < n; i++) {
            // 往左走 i -> i-1
            if (i < n - 1 && nums[i] - nums[i - 1] > nums[i + 1] - nums[i]) { // closest(i) = i+1
                cost = nums[i] - nums[i - 1]; // 只能用方式一往左走
            } else {
                cost = 1;
            }
            sum_l[i] = sum_l[i - 1] + cost;

            // 往右走 i-1 -> i
            if (i > 1 && nums[i - 1] - nums[i - 2] <= nums[i] - nums[i - 1]) { // closest(i-1) = i-2
                cost = nums[i] - nums[i - 1]; // 只能用方式一往右走
            } else {
                cost = 1;
            }
            sum_r[i] = sum_r[i - 1] + cost;
        }

        vector<int> ans(queries.size());
        for (int i = 0; i < queries.size(); i++) {
            int l = queries[i][0], r = queries[i][1];
            if (l < r) {
                // cost(0 -> r) - cost(0 -> l) = cost(l -> r)
                ans[i] = sum_r[r] - sum_r[l];
            } else {
                // cost(l -> 0) - cost(r -> 0) = cost(l -> r)
                ans[i] = sum_l[l] - sum_l[r];
            }
        }
        return ans;
    }
};
