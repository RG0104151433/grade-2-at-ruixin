// 来源：endlesscheng《两种方法：从 O(nlog) 到 O(n)（Python/Java/C++/Go）》
// https://leetcode.cn/problems/maximum-points-inside-the-square/solutions/er-fen-bian-chang-tong-shi-ji-lu-da-an-z-92w5/
// 小节：方法二：维护次小距离的最小值
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxPointsInsideSquare(vector<vector<int>>& points, string s) {
        int min_d[26], min2 = INT_MAX;
        ranges::fill(min_d, INT_MAX);
        for (int i = 0; i < points.size(); i++) {
            int d = max(abs(points[i][0]), abs(points[i][1]));
            char c = s[i] - 'a';
            if (d < min_d[c]) {
                // d 是目前最小的，那么 min_d[c] 是次小的
                min2 = min(min2, min_d[c]);
                min_d[c] = d;
            } else {
                // d 可能是次小的
                min2 = min(min2, d);
            }
        }
        int ans = 0;
        for (int d : min_d) {
            ans += d < min2;
        }
        return ans;
    }
};
