// 来源：endlesscheng《本质是两数之和：枚举异常值/枚举元素和（Python/Java/C++/Go）》
// https://leetcode.cn/problems/identify-the-largest-outlier-in-an-array/solutions/mei-ju-yi-chang-zhi-pythonjavacgo-by-end-wb3g/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int getLargestOutlier(vector<int>& nums) {
        unordered_map<int, int> cnt;
        int total = 0;
        for (int x : nums) {
            cnt[x]++;
            total += x;
        }

        int ans = INT_MIN;
        for (int x : nums) {
            cnt[x]--;
            if ((total - x) % 2 == 0 && cnt[(total - x) / 2] > 0) {
                ans = max(ans, x);
            }
            cnt[x]++;
        }
        return ans;
    }
};
