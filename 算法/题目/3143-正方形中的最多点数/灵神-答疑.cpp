// 来源：endlesscheng《两种方法：从 O(nlog) 到 O(n)（Python/Java/C++/Go）》
// https://leetcode.cn/problems/maximum-points-inside-the-square/solutions/er-fen-bian-chang-tong-shi-ji-lu-da-an-z-92w5/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxPointsInsideSquare(vector<vector<int>>& points, string s) {
        int ans = 0;

        auto check = [&](int size) -> bool {
            int vis = 0;
            for (int i = 0; i < points.size(); i++) {
                // 判断点是否在正方形中
                if (abs(points[i][0]) <= size && abs(points[i][1]) <= size) {
                    char c = s[i] - 'a';
                    if (vis >> c & 1) { // c 在集合中
                        return false;
                    }
                    vis |= 1 << c; // 把 c 加入集合
                }
            }
            ans = popcount(1u * vis);
            return true;
        };

        int left = -1, right = 1'000'000'001;
        while (left + 1 < right) {
            int mid = (left + right) / 2;
            (check(mid) ? left : right) = mid;
        }
        return ans;
    }
};
