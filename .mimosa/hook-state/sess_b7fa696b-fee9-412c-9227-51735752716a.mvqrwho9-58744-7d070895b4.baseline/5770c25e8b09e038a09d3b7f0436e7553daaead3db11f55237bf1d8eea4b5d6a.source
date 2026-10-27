// 来源：LeetCode-Solution《供暖器》
// https://leetcode.cn/problems/heaters/solutions/gong-nuan-qi-by-leetcode-solution-rwui/
// 小节：方法一：排序 + 二分查找
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int findRadius(vector<int> &houses, vector<int> &heaters) {
        int ans = 0;
        sort(heaters.begin(), heaters.end());
        for (int house: houses) {
            int j = upper_bound(heaters.begin(), heaters.end(), house) - heaters.begin();
            int i = j - 1;
            int rightDistance = j >= heaters.size() ? INT_MAX : heaters[j] - house;
            int leftDistance = i < 0 ? INT_MAX : house - heaters[i];
            int curDistance = min(leftDistance, rightDistance);
            ans = max(ans, curDistance);
        }
        return ans;
    }
};
