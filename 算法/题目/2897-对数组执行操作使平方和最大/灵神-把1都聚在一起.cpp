// 来源：灵茶山艾府《把 1 都聚在一起（Python/Java/C++/Go）》
// https://leetcode.cn/problems/apply-operations-on-array-to-maximize-sum-of-squares/solutions/ba-1-du-ju-zai-yi-qi-pythonjavacgo-by-en-rzng/
// 小节：（全文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxSum(vector<int> &nums, int k) {
        const int MOD = 1'000'000'007;
        int cnt[30]{};
        for (int x: nums) {
            for (int i = 0; i < 30; i++) {
                cnt[i] += (x >> i) & 1;
            }
        }
        long long ans = 0;
        while (k--) {
            int x = 0;
            for (int i = 0; i < 30; i++) {
                if (cnt[i] > 0) {
                    cnt[i]--;
                    x |= 1 << i;
                }
            }
            ans = (ans + (long long) x * x) % MOD;
        }
        return ans;
    }
};
