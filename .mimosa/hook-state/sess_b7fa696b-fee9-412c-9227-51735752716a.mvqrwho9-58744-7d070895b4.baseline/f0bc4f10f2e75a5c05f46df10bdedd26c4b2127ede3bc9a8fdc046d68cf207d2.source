// 来源：LeetCode-Solution《132模式》
// https://leetcode.cn/problems/132-pattern/solutions/132mo-shi-by-leetcode-solution-ye89/
// 小节：方法三：枚举 $2$
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool find132pattern(vector<int>& nums) {
        int n = nums.size();
        vector<int> candidate_i = {nums[0]};
        vector<int> candidate_j = {nums[0]};

        for (int k = 1; k < n; ++k) {
            auto it_i = upper_bound(candidate_i.begin(), candidate_i.end(), nums[k], greater<int>());
            auto it_j = lower_bound(candidate_j.begin(), candidate_j.end(), nums[k], greater<int>());
            if (it_i != candidate_i.end() && it_j != candidate_j.begin()) {
                int idx_i = it_i - candidate_i.begin();
                int idx_j = it_j - candidate_j.begin() - 1;
                if (idx_i <= idx_j) {
                    return true;
                }
            }
            
            if (nums[k] < candidate_i.back()) {
                candidate_i.push_back(nums[k]);
                candidate_j.push_back(nums[k]);
            }
            else if (nums[k] > candidate_j.back()) {
                int last_i = candidate_i.back();
                while (!candidate_j.empty() && nums[k] > candidate_j.back()) {
                    candidate_i.pop_back();
                    candidate_j.pop_back();
                }
                candidate_i.push_back(last_i);
                candidate_j.push_back(nums[k]);
            }
        }

        return false;
    }
};
