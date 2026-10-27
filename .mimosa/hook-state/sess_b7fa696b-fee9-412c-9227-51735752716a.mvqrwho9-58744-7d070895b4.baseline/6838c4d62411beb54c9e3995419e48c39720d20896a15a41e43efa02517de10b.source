// 来源：endlesscheng《两种方法：二分答案 / 逆向思维+双向链表（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-time-to-activate-string/solutions/er-fen-da-an-pythonjavacgo-by-endlessche-6s8n/
// 小节：3)
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minTime(string s, vector<int>& order, int k) {
        int n = s.size();
        if (1LL * n * (n + 1) / 2 < k) {
            return -1;
        }

        vector<int> star(n); // 避免在二分内部反复创建/初始化列表

        auto check = [&](int m) -> bool {
            m++;
            for (int j = 0; j < m; j++) {
                star[order[j]] = m;
            }
            int cnt = 0;
            int last = -1; // 上一个 '*' 的位置
            for (int i = 0; i < n; i++) {
                if (star[i] == m) { // s[i] 是 '*'
                    last = i;
                }
                cnt += last + 1;
                if (cnt >= k) { // 提前退出循环
                    return true;
                }
            }
            return false;
        };

        int left = -1, right = n - 1;
        while (left + 1 < right) {
            int mid = left + (right - left) / 2;
            (check(mid) ? right : left) = mid;
        }
        return right;
    }
};
