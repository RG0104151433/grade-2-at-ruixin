// 来源：endlesscheng《三种方法：排序 / 差分数组 / 扫描线（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/merge-intervals/solutions/jian-dan-zuo-fa-yi-ji-wei-shi-yao-yao-zh-f2b3/
// 小节：写法二
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        ranges::sort(intervals, {}, [](auto& a) { return a[0]; }); // 按照左端点从小到大排序（另一种写法）

        int n = intervals.size();
        vector<vector<int>> ans;
        int left = INT_MAX, right = INT_MIN;

        for (int i = 0; i < n; i++) {
            left = min(left, intervals[i][0]);
            right = max(right, intervals[i][1]);
            // 下一个区间与 [left, right] 不相交
            if (i == n - 1 || intervals[i + 1][0] > right) {
                ans.push_back({left, right});
                left = INT_MAX;
            }
        }

        return ans;
    }
};
