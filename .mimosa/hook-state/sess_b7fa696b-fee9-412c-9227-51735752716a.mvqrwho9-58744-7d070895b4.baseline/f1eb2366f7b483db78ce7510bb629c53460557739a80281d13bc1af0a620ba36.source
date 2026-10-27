// 来源：endlesscheng《两种方法：二分答案 / 逆向思维+双向链表（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-time-to-activate-string/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-6s8n/
// 小节：方法二：逆向思维+双向链表
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minTime(string s, vector<int>& order, int k) {
        int n = s.size();
        long long cnt = 1LL * n * (n + 1) / 2;
        if (cnt < k) { // 全改成星号也无法满足要求
            return -1;
        }

        // 数组模拟双向链表
        vector<int> prev(n + 1), next(n);
        ranges::iota(prev, -1);
        ranges::iota(next, 1);

        for (int t = n - 1; ; t--) {
            int i = order[t];
            int l = prev[i], r = next[i];
            cnt -= 1LL * (i - l) * (r - i);
            if (cnt < k) {
                return t;
            }
            // 删除链表中的 i
            if (l >= 0) {
                next[l] = r;
            }
            prev[r] = l;
        }
    }
};
