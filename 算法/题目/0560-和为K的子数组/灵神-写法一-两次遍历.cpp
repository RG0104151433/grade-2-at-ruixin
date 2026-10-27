// 来源：endlesscheng《前缀和+哈希表：从两次遍历到一次遍历，附变形题（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/subarray-sum-equals-k/solutions/qian-zhui-he-ha-xi-biao-cong-liang-ci-bi-4mwr/
// 小节：写法一：两次遍历
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> s(n + 1);
        for (int i = 0; i < n; i++) {
            s[i + 1] = s[i] + nums[i];
        }

        unordered_map<int, int> cnt;
        int ans = 0;
        for (int sj : s) {
            // 注意不要直接 += cnt[sj-k]，如果 sj-k 不存在，会插入 sj-k
            ans += cnt.contains(sj - k) ? cnt[sj - k] : 0;
            cnt[sj]++;
        }
        return ans;
    }
};
