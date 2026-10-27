// 来源：endlesscheng《二分答案，附题单（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-time-to-complete-trips/solutions/er-fen-da-an-python-yi-xing-gao-ding-by-xwvs8/
// 小节：细节
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long minimumTime(vector<int>& time, int totalTrips) {
        auto check = [&](long long x) -> bool {
            long long sum = 0;
            for (int t : time) {
                sum += x / t;
                if (sum >= totalTrips) {
                    return true;
                }
            }
            return false;
        };

        int min_t = ranges::min(time);
        long long left = min_t - 1; // 循环不变量：check(left) 恒为 false
        long long right = 1LL * min_t * totalTrips; // 循环不变量：check(right) 恒为 true
        while (left + 1 < right) { // 开区间 (left, right) 不为空
            long long mid = left + (right - left) / 2;
            (check(mid) ? right : left) = mid;
        }
        // 此时 left 等于 right-1
        // check(left) = false 且 check(right) = true，所以答案是 right
        return right; // 最小的 true
    }
};
