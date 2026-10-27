// 来源：endlesscheng《排序 + 单调栈二分（通用做法是 DP）Python/Java/C++/Go》
// https://leetcode.cn/problems/two-best-non-overlapping-events/solutions/yong-you-xian-dui-lie-wei-hu-ling-yi-ge-8ld3x/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxTwoEvents(vector<vector<int>>& events) {
        // 按照结束时间排序
        ranges::sort(events, {}, [](auto& e) { return e[1]; });

        // 从栈底到栈顶，结束时间递增，价值递增
        vector<pair<int, int>> st = {{0, 0}}; // 栈底哨兵
        int ans = 0;
        for (auto& e : events) {
            int start_time = e[0], value = e[2];
            // 二分查找最后一个结束时间 < start_time 的活动
            auto it = --ranges::lower_bound(st, start_time, {}, &pair<int, int>::first);
            ans = max(ans, it->second + value);
            // 遇到比栈顶更大的价值，入栈
            if (value > st.back().second) {
                st.emplace_back(e[1], value);
            }
        }
        return ans;
    }
};
