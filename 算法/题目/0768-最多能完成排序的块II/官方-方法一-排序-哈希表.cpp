// 来源：LeetCode-Solution《最多能完成排序的块 II》
// https://leetcode.cn/problems/max-chunks-to-make-sorted-ii/solutions/zui-duo-neng-wan-cheng-pai-xu-de-kuai-ii-w5c6/
// 小节：方法一：排序 + 哈希表
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maxChunksToSorted(vector<int>& arr) {
        unordered_map<int, int> cnt;
        int res = 0;
        vector<int> sortedArr = arr;
        sort(sortedArr.begin(), sortedArr.end());
        for (int i = 0; i < sortedArr.size(); i++) {
            int x = arr[i], y = sortedArr[i];
            cnt[x]++;
            if (cnt[x] == 0) {
                cnt.erase(x);
            }
            cnt[y]--;
            if (cnt[y] == 0) {
                cnt.erase(y);
            }
            if (cnt.size() == 0) {
                res++;
            }
        }
        return res;
    }
};
