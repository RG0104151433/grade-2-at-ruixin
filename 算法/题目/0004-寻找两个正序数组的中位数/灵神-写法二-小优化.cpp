// 来源：endlesscheng《【图解】循序渐进：从排序到双指针到二分（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/median-of-two-sorted-arrays/solutions/tu-jie-xun-xu-jian-jin-cong-shuang-zhi-z-p2gd/
// 小节：写法二（小优化）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
        if (a.size() > b.size()) {
            swap(a, b); // 保证下面的 i 可以从 0 开始枚举
        }

        int m = a.size(), n = b.size();
        a.insert(a.begin(), INT_MIN); // 最左边插入 -∞
        b.insert(b.begin(), INT_MIN);
        a.push_back(INT_MAX); // 最右边插入 ∞
        b.push_back(INT_MAX);

        // 枚举 nums1 有 i 个数在第一组
        // 那么 nums2 有 j = (m + n + 1) / 2 - i 个数在第一组
        int i = 0, j = (m + n + 1) / 2;
        while (a[i + 1] <= b[j]) {
            i++; // 继续枚举
            j--;
        }

        int max1 = max(a[i], b[j]); // 第一组的最大值
        int min2 = min(a[i + 1], b[j + 1]); // 第二组的最小值
        return (m + n) % 2 ? max1 : (max1 + min2) / 2.0;
    }
};
