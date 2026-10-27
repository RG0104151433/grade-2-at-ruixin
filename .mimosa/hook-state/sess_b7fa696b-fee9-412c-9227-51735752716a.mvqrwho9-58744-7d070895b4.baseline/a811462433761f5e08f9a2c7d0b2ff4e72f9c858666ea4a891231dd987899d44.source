// 来源：LeetCode-Solution《供暖器》
// https://leetcode.cn/problems/heaters/solutions/gong-nuan-qi-by-leetcode-solution-rwui/
// 小节：方法二：排序 + 双指针
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int findRadius(vector<int>& houses, vector<int>& heaters) {
        sort(houses.begin(), houses.end());
        sort(heaters.begin(), heaters.end());
        int ans = 0;
        for (int i = 0, j = 0; i < houses.size(); i++) {
            int curDistance = abs(houses[i] - heaters[j]);
            while (j < heaters.size() - 1 && abs(houses[i] - heaters[j]) >= abs(houses[i] - heaters[j + 1])) {
                j++;
                curDistance = min(curDistance, abs(houses[i] - heaters[j]));
            }
            ans = max(ans, curDistance);
        }
        return ans;
    }
};
