// 来源：endlesscheng《【图解】循序渐进：从排序到双指针到二分（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/median-of-two-sorted-arrays/solutions/tu-jie-xun-xu-jian-jin-cong-shuang-zhi-z-p2gd/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
        if (a.size() > b.size()) {
            swap(a, b); // 保证下面的 i 可以从 0 开始枚举
        }

        int m = a.size(), n = b.size();
        a.insert(a.begin(), INT_MIN);
        b.insert(b.begin(), INT_MIN);
        a.push_back(INT_MAX);
        b.push_back(INT_MAX);

        // 循环不变量：a[left] <= b[j+1]
        // 循环不变量：a[right] > b[j+1]
        int left = 0, right = m + 1;
        while (left + 1 < right) { // 开区间 (left, right) 不为空
            int i = left + (right - left) / 2;
            int j = (m + n + 1) / 2 - i;
            if (a[i] <= b[j + 1]) {
                left = i; // 缩小二分区间为 (i, right)
            } else {
                right = i; // 缩小二分区间为 (left, i)
            }
        }

        // 此时 left 等于 right-1
        // a[left] <= b[j+1] 且 a[right] > b[(j-1)+1] = b[j]，所以答案是 i=left
        int i = left;
        int j = (m + n + 1) / 2 - i;
        int max1 = max(a[i], b[j]);
        int min2 = min(a[i + 1], b[j + 1]);
        return (m + n) % 2 ? max1 : (max1 + min2) / 2.0;
    }
};
