// 来源：endlesscheng《【图解】循序渐进：从排序到双指针到二分（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/median-of-two-sorted-arrays/solutions/tu-jie-xun-xu-jian-jin-cong-shuang-zhi-z-p2gd/
// 小节：一、引入：均匀分组
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
        auto merged = a;
        merged.insert(merged.end(), b.begin(), b.end());
        ranges::sort(merged);

        int s = merged.size();
        int k = (s - 1) / 2;
        return s % 2 ? merged[k] : (merged[k] + merged[k + 1]) / 2.0;
    }
};
