// 来源：endlesscheng《二分答案 + 上下界优化（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-k-to-reduce-array-within-limit/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-qt0r/
// 小节：优化前
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minimumK(vector<int>& nums) {
        int n = nums.size();

        auto check = [&](int k) -> bool {
            long long sum = n;
            for (int x : nums) {
                sum += (x - 1) / k;
            }
            return sum <= 1LL * k * k;
        };

        int left = ceil(sqrt(n)) - 1;
        int right = ranges::max(nums);
        while (left + 1 < right) {
            int mid = (left + right) / 2;
            (check(mid) ? right : left) = mid;
        }
        return left + 1;
    }
};
