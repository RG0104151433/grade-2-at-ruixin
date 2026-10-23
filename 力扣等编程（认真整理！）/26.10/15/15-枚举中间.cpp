// 找出一个数组中所有不重复的何为0的三元数组 

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        set<vector<int>> res;

        for (int mid = 1; mid < n - 1; ++mid) {
            int left = 0;
            int right = n - 1;

            while (left < mid && mid < right) {
                int sum = nums[left] + nums[mid] + nums[right];

                if (sum < 0) {
                    ++left;
                } else if (sum > 0) {
                    --right;
                } else {
                    res.insert({nums[left], nums[mid], nums[right]});

                    ++left;
                    --right;

                    // 跳过重复的 left 和 right，减少重复插入
                    while (left < mid && nums[left] == nums[left - 1]) ++left;
                    while (mid < right && nums[right] == nums[right + 1]) --right;
                }
            }
        }

        return vector<vector<int>>(res.begin(), res.end());
    }
};
