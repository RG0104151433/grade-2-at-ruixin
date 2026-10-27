// 来源：endlesscheng《两种方法：前缀和 / 定长滑动窗口（Python/Java/C++/Go）》
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-using-strategy/solutions/liang-chong-fang-fa-qian-zhui-he-ding-ch-uq98/
// 小节：方法二：定长滑动窗口
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long maxProfit(vector<int>& prices, vector<int>& strategy, int k) {
        long long total = 0;
        long long extra = 0;
        long long max_extra = 0;

        for (int i = 0; i < prices.size(); i++) {
            total += strategy[i] * prices[i];
            if (i < k / 2) {
                continue;
            }

            // 1. 入
            extra -= strategy[i - k / 2] * prices[i - k / 2]; // 前 k/2 个元素的窗口
            extra += (1 - strategy[i]) * prices[i]; // 后 k/2 个元素的窗口

            int left = i - k + 1;
            if (left < 0) { // 尚未形成第一个窗口
                continue;
            }

            // 2. 更新
            max_extra = max(max_extra, extra);

            // 3. 出（计算方式和入相反）
            extra += strategy[left] * prices[left]; // 前 k/2 个元素的窗口
            extra -= (1 - strategy[left + k / 2]) * prices[left + k / 2]; // 后 k/2 个元素的窗口
        }

        return total + max_extra;
    }
};
