// 来源：endlesscheng《两种方法：最小堆模拟/二分答案（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-number-of-seconds-to-make-mountain-height-zero/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-myg4/
// 小节：方法二：二分答案
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long minNumberOfSeconds(int mountainHeight, vector<int>& workerTimes) {
        auto check = [&](long long m) {
            int left_h = mountainHeight;
            for (int t : workerTimes) {
                left_h -= ((int) sqrt(m / t * 8 + 1) - 1) / 2;
                if (left_h <= 0) {
                    return true;
                }
            }
            return false;
        };

        int max_t = ranges::max(workerTimes);
        int h = (mountainHeight - 1) / workerTimes.size() + 1;
        long long left = 0, right = (long long) max_t * h * (h + 1) / 2;
        while (left + 1 < right) {
            long long mid = (left + right) / 2;
            (check(mid) ? right : left) = mid;
        }
        return right;
    }
};
