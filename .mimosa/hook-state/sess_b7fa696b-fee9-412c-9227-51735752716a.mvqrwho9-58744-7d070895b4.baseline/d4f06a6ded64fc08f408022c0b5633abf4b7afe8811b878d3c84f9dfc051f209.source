// 来源：endlesscheng《逆向思维（Python/Java/C++/Go）》
// https://leetcode.cn/problems/process-string-with-special-operations-ii/solutions/ni-xiang-si-wei-pythonjavacgo-by-endless-26al/
// 小节：优化前
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    char processStr(string s, long long k) {
        int n = s.size();
        vector<long long> size(n);
        long long sz = 0;
        for (int i = 0; i < n; i++) {
            char c = s[i];
            if (c == '*') {
                sz = max(sz - 1, 0LL);
            } else if (c == '#') {
                sz *= 2; // 题目保证 sz <= 1e15
            } else if (c != '%') { // c 是字母
                sz++;
            }
            size[i] = sz;
        }

        if (k >= size[n - 1]) { // 下标越界
            return '.';
        }

        // 迭代
        for (int i = n - 1; ; i--) {
            char c = s[i];
            sz = size[i];
            if (c == '#') {
                if (k >= sz / 2) { // k 在复制后的右半边
                    k -= sz / 2;
                }
            } else if (c == '%') {
                k = sz - 1 - k; // 反转前的下标为 sz-1-k 的字母就是答案
            } else if (c != '*' && k == sz - 1) { // 找到答案
                return c;
            }
        }
    }
};
