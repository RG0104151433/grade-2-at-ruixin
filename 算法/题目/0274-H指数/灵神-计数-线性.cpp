// 来源：endlesscheng《没看懂题意？一张图秒懂（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/h-index/solutions/mei-kan-dong-ti-yi-yi-zhang-tu-miao-dong-8zps/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
public:
    int hIndex(vector<int>& citations) {
        int n = citations.size();
        vector<int> cnt(n + 1);
        for (int c : citations) {
            cnt[min(c, n)]++; // 引用次数 > n，等价于引用次数为 n
        }
        int s = 0;
        for (int i = n; ; i--) { // i=0 的时候，s>=i 一定成立
            s += cnt[i];
            if (s >= i) { // 说明有至少 i 篇论文的引用次数至少为 i
                return i;
            }
        }
    }
};
