// 来源：endlesscheng《最小堆模拟（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-operations-to-exceed-threshold-value-ii/solutions/zui-xiao-dui-mo-ni-pythonjavacgo-by-endl-07jk/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minOperations(vector<int>& nums, int k) {
        priority_queue<long long, vector<long long>, greater<>> pq(nums.begin(), nums.end());
        int ans = 0;
        while (pq.top() < k) {
            long long x = pq.top(); pq.pop();
            long long y = pq.top(); pq.pop();
            pq.push(x * 2 + y);
            ans++;
        }
        return ans;
    }
};
