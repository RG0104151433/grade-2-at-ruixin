// 来源：endlesscheng《本质是爬楼梯：记忆化搜索 / 递推（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/combination-sum-iv/solutions/ben-zhi-shi-pa-lou-ti-cong-ji-yi-hua-sou-y52j/
// 小节：一、递归搜索 + 保存递归返回值 = 记忆化搜索
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        vector<int> memo(target + 1, -1); // -1 表示没有计算过
        auto dfs = [&](this auto&& dfs, int i) {
            if (i == 0) { // 爬完了
                return 1;
            }
            int &res = memo[i]; // 注意这里是引用
            if (res != -1) { // 之前计算过
                return res;
            }
            res = 0;
            for (int x : nums) {
                if (x <= i) {
                    res += dfs(i - x);
                }
            }
            return res;
        };
        return dfs(target);
    }
};
