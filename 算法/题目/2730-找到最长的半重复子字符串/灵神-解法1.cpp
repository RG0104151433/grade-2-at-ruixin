// 来源：endlesscheng《滑动窗口，简洁写法（Python/Java/C++/Go）》
// https://leetcode.cn/problems/find-the-longest-semi-repetitive-substring/solutions/shuang-zhi-zhen-hua-chuang-pythonjavacgo-nurf/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int longestSemiRepetitiveSubstring(string s) {
        int ans = 1, cnt = 0, left = 0;
        for (int right = 1; right < s.size(); right++) {
            if (s[right] == s[right - 1]) {
                cnt++;
            }
            while (cnt > 1) {
                if (s[left] == s[left + 1]) {
                    cnt--; // left 离开窗口后，和 left+1 断开
                }
                left++;
            }
            ans = max(ans, right - left + 1);
        }
        return ans;
    }
};
