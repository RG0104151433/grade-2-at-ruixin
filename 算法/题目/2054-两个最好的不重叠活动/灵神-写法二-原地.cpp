// 来源：endlesscheng《排序 + 单调栈二分（通用做法是 DP）Python/Java/C++/Go》
// https://leetcode.cn/problems/two-best-non-overlapping-events/solutions/yong-you-xian-dui-lie-wei-hu-ling-yi-ge-8ld3x/
// 小节：写法二：原地
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxTwoEvents(vector<vector<int>>& events) {
        ranges::sort(events, {}, [](auto& e) { return e[1]; });

        int ans = 0, size = 0; // 把 events 当作栈
        for (auto& e : events) {
            int start_time = e[0], value = e[2];
            auto it = ranges::lower_bound(events.begin(), events.begin() + size, start_time, {}, [](auto& e) { return e[1]; });
            if (it != events.begin()) {
                ans = max(ans, value + (*--it)[2]);
            } else {
                ans = max(ans, value);
            }

            if (size == 0 || value > events[size - 1][2]) {
                events[size++] = e;
            }
        }
        return ans;
    }
};
