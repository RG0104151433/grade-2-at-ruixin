// 来源：endlesscheng《教你如何思考这题（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/solutions/qu-jian-xuan-dian-wen-ti-pythonjavaccgoj-w9am/
// 小节：细节
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        ranges::sort(points, {}, [](auto& p) { return p[1]; }); // 按照右端点从小到大排序
        int ans = 0;
        long long pre = LLONG_MIN;
        for (auto& p : points) {
            if (p[0] > pre) { // 上一个点在区间左边
                ans++;
                pre = p[1]; // 在区间的最右边放一个点
            }
        }
        return ans;
    }
};
