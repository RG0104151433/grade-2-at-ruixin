// 来源：endlesscheng《分类讨论（Python/Java/C++/Go）》
// https://leetcode.cn/problems/minimum-operations-to-sort-a-permutation/solutions/fen-lei-tao-lun-pythonjavacgo-by-endless-8jsl/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
public:
    int minOperations(vector<int>& nums) {
        int n = nums.size();
        int cnt = 0;
        int p = 0;
        for (int i = 1; i < n && cnt < 2; i++) {
            if (nums[i - 1] > nums[i]) {
                cnt++;
                p = i;
            }
        }

        if (cnt == 0) { // 已是递增
            return 0;
        }
        int ans = INT_MAX;
        if (cnt == 1 && nums[0] > nums[n - 1]) { // 两个递增段
            ans = min(p, n - p + 2);
        }

        cnt = p = 0;
        for (int i = 1; i < n && cnt < 2; i++) {
            if (nums[i - 1] < nums[i]) {
                cnt++;
                p = i;
            }
        }

        if (cnt == 0) { // 已是递减
            return 1;
        }
        if (cnt == 1 && nums[0] < nums[n - 1]) { // 两个递减段
            ans = min(ans, min(p, n - p) + 1);
        }

        return ans == INT_MAX ? -1 : ans;
    }
};
