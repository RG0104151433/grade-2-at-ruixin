// 来源：endlesscheng《等价转换 + 贪心（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-sum-of-squared-difference/solutions/by-endlesscheng-5qmk/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long minSumSquareDiff(vector<int>& a, vector<int>& nums2, int k1, int k2) {
        int n = a.size(), k = k1 + k2;
        long long ans = 0, sum = 0;
        for (int i = 0; i < n; i++) {
            a[i] = abs(a[i] - nums2[i]);
            sum += a[i];
            ans += 1LL * a[i] * a[i];
        }
        if (sum <= k) { // 所有 a[i] 均可为 0
            return 0;
        }

        ranges::sort(a, greater());
        a.push_back(0); // 哨兵
        for (int i = 0; ; i++) {
            long long v = a[i];
            ans -= v * v; // 撤销上面的 ans += a[i] * a[i]
            int j = i + 1;
            long long c = j * (v - a[j]);
            if (c < k) {
                k -= c;
                continue;
            }
            v -= k / j;
            return ans + k % j * (v - 1) * (v - 1) + (j - k % j) * v * v;
        }
    }
};
