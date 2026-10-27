// 来源：endlesscheng《【图解】f[n]=2*f[n-1]+f[n-3]（Python/Java/C++/Go）》
// https://leetcode.cn/problems/domino-and-tromino-tiling/solutions/by-endlesscheng-umpp/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
    const int MOD = 1'000'000'007;
public:
    int numTilings(int n) {
        if (n == 1) {
            return 1;
        }
        vector<long long> f(n + 1);
        f[0] = f[1] = 1;
        f[2] = 2;
        for (int i = 3; i <= n; i++) {
            f[i] = (f[i - 1] * 2 + f[i - 3]) % MOD;
        }
        return f[n];
    }
};
