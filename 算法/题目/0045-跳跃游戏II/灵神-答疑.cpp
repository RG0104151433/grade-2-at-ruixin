// 来源：endlesscheng《【图解】一张图秒懂跳跃游戏！（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/jump-game-ii/solutions/tu-jie-yi-zhang-tu-miao-dong-tiao-yue-yo-h2d4/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int jump(vector<int>& nums) {
        int ans = 0;
        int cur_end = 0; // 已建造的桥的右端点
        int next_end = 0; // 下一座桥的右端点的最大值
        for (int i = 0; i + 1 < nums.size(); i++) {
            // 遍历的过程中，记录下一座桥的最远点
            next_end = max(next_end, i + nums[i]);
            if (i == cur_end) { // 无路可走，必须建桥
                cur_end = next_end; // 建桥后，最远可以到达 next_end
                ans++;
            }
        }
        return ans;
    }
};
