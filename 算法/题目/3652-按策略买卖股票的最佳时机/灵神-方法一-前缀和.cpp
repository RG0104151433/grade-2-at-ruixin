// 来源：endlesscheng《两种方法：前缀和 / 定长滑动窗口（Python/Java/C++/Go）》
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-using-strategy/solutions/liang-chong-fang-fa-qian-zhui-he-ding-ch-uq98/
// 小节：方法一：前缀和
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long maxProfit(vector<int>& prices, vector<int>& strategy, int k) {
        int n = prices.size();
        vector<long long> sum(n + 1), sum_sell(n + 1);
        for (int i = 0; i < n; i++) {
            sum[i + 1] = sum[i] + prices[i] * strategy[i];
            sum_sell[i + 1] = sum_sell[i] + prices[i];
        }

        long long ans = sum[n]; // 不修改
        for (int i = k; i <= n; i++) {
            long long res = sum[i - k] + sum[n] - sum[i] + sum_sell[i] - sum_sell[i - k / 2];
            ans = max(ans, res);
        }
        return ans;
    }
};
