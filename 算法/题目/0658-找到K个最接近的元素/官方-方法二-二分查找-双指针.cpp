// 来源：LeetCode-Solution《找到 K 个最接近的元素》
// https://leetcode.cn/problems/find-k-closest-elements/solutions/zhao-dao-k-ge-zui-jie-jin-de-yuan-su-by-ekwtd/
// 小节：方法二：二分查找 + 双指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<int> findClosestElements(vector<int>& arr, int k, int x) {
        int right = lower_bound(arr.begin(), arr.end(), x) - arr.begin();
        int left = right - 1;
        while (k--) {
            if (left < 0) {
                right++;
            } else if (right >= arr.size()) {
                left--;
            } else if (x - arr[left] <= arr[right] - x) {
                left--;
            } else {
                right++;
            }
        }
        return vector<int>(arr.begin() + left + 1, arr.begin() + right);
    }
};
