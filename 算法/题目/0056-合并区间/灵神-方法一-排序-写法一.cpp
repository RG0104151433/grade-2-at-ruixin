// 来源：endlesscheng《三种方法：排序 / 差分数组 / 扫描线（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/merge-intervals/solutions/jian-dan-zuo-fa-yi-ji-wei-shi-yao-yao-zh-f2b3/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        ranges::sort(intervals); // 按照左端点从小到大排序

        vector<vector<int>> ans;
        for (auto& p : intervals) {
            if (!ans.empty() && p[0] <= ans.back()[1]) { // 左端点在合并区间内，可以合并
                ans.back()[1] = max(ans.back()[1], p[1]); // 更新合并区间的右端点
            } else { // 不相交，无法合并
                ans.emplace_back(p); // 新的合并区间
            }
        }
        return ans;
    }
};
