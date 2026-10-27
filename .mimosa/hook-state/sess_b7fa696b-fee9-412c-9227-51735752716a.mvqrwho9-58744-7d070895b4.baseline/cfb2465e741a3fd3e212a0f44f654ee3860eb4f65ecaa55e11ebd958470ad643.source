// 来源：endlesscheng《【图解】一图掌握二分答案，四种写法（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/h-index-ii/solutions/tu-jie-yi-tu-zhang-wo-er-fen-da-an-si-ch-d15k/
// 小节：开区间写法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int hIndex(vector<int> &citations) {
        // 在区间 (left, right) 内询问
        int n = citations.size();
        int left = 0;
        int right = n + 1;
        while (left + 1 < right) { // 区间不为空
            // 循环不变量：
            // left 的回答一定为「是」
            // right 的回答一定为「否」
            int mid = (left + right) / 2;
            // 引用次数最多的 mid 篇论文，引用次数均 >= mid
            if (citations[n - mid] >= mid) {
                left = mid; // 询问范围缩小到 (mid, right)
            } else {
                right = mid; // 询问范围缩小到 (left, mid)
            }
        }
        // 根据循环不变量，left 现在是最大的回答为「是」的数
        return left;
    }
};
