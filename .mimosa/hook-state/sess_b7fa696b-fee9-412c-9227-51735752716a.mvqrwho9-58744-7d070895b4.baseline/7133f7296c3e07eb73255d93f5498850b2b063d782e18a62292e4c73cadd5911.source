// 来源：endlesscheng《前缀和+哈希表：从两次遍历到一次遍历，附变形题（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/subarray-sum-equals-k/solutions/qian-zhui-he-ha-xi-biao-cong-liang-ci-bi-4mwr/
// 小节：写法三：一次遍历 · 其二
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        int ans = 0, s = 0;
        for (int x : nums) {
            cnt[s]++;
            s += x;
            // 注意不要直接 += cnt[s-k]，如果 s-k 不存在，这会插入 s-k，消耗更多空间
            ans += cnt.contains(s - k) ? cnt[s - k] : 0;
        }
        return ans;
    }
};
