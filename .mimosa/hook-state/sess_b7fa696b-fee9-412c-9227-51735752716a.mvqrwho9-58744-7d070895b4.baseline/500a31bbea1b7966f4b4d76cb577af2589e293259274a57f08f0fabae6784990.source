// 来源：LeetCode-Solution《找到 K 个最接近的元素》
// https://leetcode.cn/problems/find-k-closest-elements/solutions/zhao-dao-k-ge-zui-jie-jin-de-yuan-su-by-ekwtd/
// 小节：方法一：排序
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> findClosestElements(vector<int>& arr, int k, int x) {
        sort(arr.begin(), arr.end(), [x](int a, int b) -> bool {
            return abs(a - x) < abs(b - x) || abs(a - x) == abs(b - x) && a < b;
        });
        sort(arr.begin(), arr.begin() + k);
        return vector<int>(arr.begin(), arr.begin() + k);
    }
};
