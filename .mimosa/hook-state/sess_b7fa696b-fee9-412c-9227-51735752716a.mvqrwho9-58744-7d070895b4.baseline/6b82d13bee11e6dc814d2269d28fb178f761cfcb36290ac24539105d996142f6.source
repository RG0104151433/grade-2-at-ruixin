// 来源：endlesscheng《两种理解方式：维护最右可达位置/合并区间（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/jump-game/solutions/liang-chong-li-jie-fang-shi-wei-hu-zui-y-q67s/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool canJump(vector<int>& nums) {
        int mx = 0;
        for (int i = 0; i < nums.size(); i++) {
            if (i > mx) { // 无法到达 i
                return false;
            }
            mx = max(mx, i + nums[i]); // 从 i 最右可以跳到 i + nums[i]
        }
        return true;
    }
};
