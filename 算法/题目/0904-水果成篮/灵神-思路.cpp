// 来源：endlesscheng《滑动窗口+哈希表（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/fruit-into-baskets/solutions/hua-dong-chuang-kou-ha-xi-biao-pythonjav-uzmw/
// 小节：思路
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        int ans = 0, left = 0;
        unordered_map<int, int> cnt;
        for (int right = 0; right < fruits.size(); right++) {
            cnt[fruits[right]]++; // fruits[right] 进入窗口
            while (cnt.size() > 2) { // 不满足要求
                int out = fruits[left];
                cnt[out]--; // fruits[left] 离开窗口
                if (cnt[out] == 0) {
                    cnt.erase(out);
                }
                left++;
            }
            ans = max(ans, right - left + 1);
        }
        return ans;
    }
};
