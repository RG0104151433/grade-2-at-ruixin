// 来源：endlesscheng《两种方法：最小堆模拟/二分答案（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-number-of-seconds-to-make-mountain-height-zero/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-myg4/
// 小节：方法一：最小堆模拟
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long minNumberOfSeconds(int mountainHeight, vector<int>& workerTimes) {
        priority_queue<tuple<long long, long long, int>, vector<tuple<long long, long long, int>>, greater<>> pq;
        for (int t : workerTimes) {
            pq.emplace(t, t, t);
        }

        long long ans = 0;
        while (mountainHeight--) {
            // 工作后总用时，当前工作（山高度降低 1）用时，workerTimes[i]
            auto [total, cur, base] = pq.top(); pq.pop();
            ans = total; // 最后一个出堆的 total 即为答案
            pq.emplace(total + cur + base, cur + base, base);
        }
        return ans;
    }
};
