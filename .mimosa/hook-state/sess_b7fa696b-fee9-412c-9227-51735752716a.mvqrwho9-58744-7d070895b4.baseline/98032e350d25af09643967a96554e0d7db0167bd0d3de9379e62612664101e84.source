// 来源：LeetCode-Solution《有效的完全平方数》
// https://leetcode.cn/problems/valid-perfect-square/solutions/you-xiao-de-wan-quan-ping-fang-shu-by-le-wkee/
// 小节：方法三：二分查找
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isPerfectSquare(int num) {
        int left = 0, right = num;
        while (left <= right) {
            int mid = (right - left) / 2 + left;
            long square = (long) mid * mid;
            if (square < num) {
                left = mid + 1;
            } else if (square > num) {
                right = mid - 1;
            } else {
                return true;
            }
        }
        return false;
    }
};
