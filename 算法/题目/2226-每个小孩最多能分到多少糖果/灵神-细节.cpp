// 来源：endlesscheng《二分答案（Python/Java/C++/Go）》
// https://leetcode.cn/problems/maximum-candies-allocated-to-k-children/solutions/by-endlesscheng-y031/
// 小节：细节
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maximumCandies(vector<int>& candies, long long k) {
        auto check = [&](int low) -> bool {
            long long sum = 0;
            for (int c : candies) {
                sum += c / low;
                if (sum >= k) { // 提前返回
                    return true;
                }
            }
            return false;
        };

        long long avg = reduce(candies.begin(), candies.end(), 0LL) / k;
        int left = 0, right = min(1LL * ranges::max(candies), avg) + 1;
        while (left + 1 < right) {
            int mid = left + (right - left) / 2;
            (check(mid) ? left : right) = mid;
        }
        return left;
    }
};
