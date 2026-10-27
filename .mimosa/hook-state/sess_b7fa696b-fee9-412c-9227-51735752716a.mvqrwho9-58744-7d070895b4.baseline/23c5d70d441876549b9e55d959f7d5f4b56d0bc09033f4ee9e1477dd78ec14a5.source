// 来源：endlesscheng《本质是爬楼梯：记忆化搜索 / 递推（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/combination-sum-iv/solutions/ben-zhi-shi-pa-lou-ti-cong-ji-yi-hua-sou-y52j/
// 小节：答疑
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        // 使用 unsigned 可以让溢出不报错
        // 对于溢出的数据，不会影响答案的正确性（题目保证）
        vector<unsigned> f(target + 1);
        f[0] = 1;
        for (int i = 1; i <= target; i++) {
            for (int x : nums) {
                if (x <= i) {
                    f[i] += f[i - x];
                }
            }
        }
        return f[target];
    }
};
