// 来源：LeetCode-Solution《有效的完全平方数》
// https://leetcode.cn/problems/valid-perfect-square/solutions/you-xiao-de-wan-quan-ping-fang-shu-by-le-wkee/
// 小节：方法四：牛顿迭代法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isPerfectSquare(int num) {
        double x0 = num;
        while (true) {
            double x1 = (x0 + num / x0) / 2;
            if (x0 - x1 < 1e-6) {
                break;
            }
            x0 = x1;
        }
        int x = (int) x0;
        return x * x == num;
    }
};
