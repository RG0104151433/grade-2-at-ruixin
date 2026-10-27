// 来源：endlesscheng《【视频】两种写法：循环外更新/循环内更新，附题单（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-size-subarray-sum/solutions/biao-ti-xia-biao-zong-suan-cuo-qing-kan-k81nh/
// 小节：写法二：在 while 循环内更新答案
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int n = nums.size(), ans = n + 1, sum = 0, left = 0;
        for (int right = 0; right < n; right++) { // 枚举子数组右端点
            sum += nums[right];
            while (sum >= target) { // 满足要求
                ans = min(ans, right - left + 1);
                sum -= nums[left];
                left++; // 左端点右移
            }
        }
        return ans <= n ? ans : 0;
    }
};
