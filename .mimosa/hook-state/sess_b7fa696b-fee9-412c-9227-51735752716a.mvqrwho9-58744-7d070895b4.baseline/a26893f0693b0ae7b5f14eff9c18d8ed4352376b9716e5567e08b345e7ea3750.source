// 来源：endlesscheng《二分答案 + 上下界优化（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-k-to-reduce-array-within-limit/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-qt0r/
// 小节：优化
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minimumK(vector<int>& nums) {
        int n = nums.size();
        int mx = ranges::max(nums);
        long long total = reduce(nums.begin(), nums.end(), 0LL);

        auto non_positive = [&](int k) -> long long {
            long long sum = n;
            for (int x : nums) {
                sum += (x - 1) / k;
            }
            return sum;
        };

        int left = max(ceil(sqrt(n)), ceil(cbrt(total))) - 1;
        int right = ceil(sqrt(non_positive(left + 1)));
        while (left + 1 < right) {
            int k = (left + right) / 2;
            (non_positive(k) <= 1LL * k * k ? right : left) = k;
        }
        return left + 1;
    }
};
