// 来源：endlesscheng《【图解】循序渐进：从排序到双指针到二分（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/median-of-two-sorted-arrays/solutions/tu-jie-xun-xu-jian-jin-cong-shuang-zhi-z-p2gd/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
        if (a.size() > b.size()) {
            swap(a, b);
        }

        int m = a.size(), n = b.size();
        // 循环不变量：a[left] <= b[j+1]
        // 循环不变量：a[right] > b[j+1]
        int left = -1, right = m;
        while (left + 1 < right) { // 开区间 (left, right) 不为空
            int i = left + (right - left) / 2;
            int j = (m + n + 1) / 2 - i - 2;
            if (a[i] <= b[j + 1]) {
                left = i; // 缩小二分区间为 (i, right)
            } else {
                right = i; // 缩小二分区间为 (left, i)
            }
        }

        // 此时 left 等于 right-1
        // a[left] <= b[j+1] 且 a[right] > b[(j-1)+1] = b[j]，所以答案是 i=left
        int i = left;
        int j = (m + n + 1) / 2 - i - 2;
        int ai = i >= 0 ? a[i] : INT_MIN;
        int bj = j >= 0 ? b[j] : INT_MIN;
        int ai1 = i + 1 < m ? a[i + 1] : INT_MAX;
        int bj1 = j + 1 < n ? b[j + 1] : INT_MAX;
        int max1 = max(ai, bj);
        int min2 = min(ai1, bj1);
        return (m + n) % 2 ? max1 : (max1 + min2) / 2.0;
    }
};
