// 来源：endlesscheng《三种方法：排序 / 差分数组 / 扫描线（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/merge-intervals/solutions/jian-dan-zuo-fa-yi-ji-wei-shi-yao-yao-zh-f2b3/
// 小节：方法三：扫描线
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        map<int, int> events;
        for (auto& p : intervals) {
            events[p[0]]++; // 垂线遇到左端点则加一
            events[p[1]]--; // 垂线遇到右端点则减一
            // 这样处理后，就可以把 cnt 的更新逻辑统一成 cnt += events[x]，无需区分左右端点
        }

        vector<vector<int>> ans;
        int cnt = 0;
        int start;
        for (auto& [x, c] : events) {
            if (cnt == 0) { // 扫描线开始与区间相交
                start = x; // x 是合并后的区间左端点
            }
            cnt += c;
            if (cnt == 0) { // 扫描线结束与区间相交
                ans.push_back({start, x}); // x 是合并后的区间右端点
            }
        }
        return ans;
    }
};
