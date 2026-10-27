// 来源：LeetCode-Solution《有效的完全平方数》
// https://leetcode.cn/problems/valid-perfect-square/solutions/you-xiao-de-wan-quan-ping-fang-shu-by-le-wkee/
// 小节：方法二：暴力
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isPerfectSquare(int num) {
        long x = 1, square = 1;
        while (square <= num) {
            if (square == num) {
                return true;
            }
            ++x;
            square = x * x;
        }
        return false;
    }
};
