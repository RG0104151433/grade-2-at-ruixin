// 来源：endlesscheng《26 个栈（Python/Java/C++/Go）》
// https://leetcode.cn/problems/find-mirror-score-of-a-string/solutions/26-ge-zhan-pythonjavacgo-by-endlesscheng-ysmk/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    long long calculateScore(string s) {
        stack<int> stk[26];
        long long ans = 0;
        for (int i = 0; i < s.size(); i++) {
            int c = s[i] - 'a';
            if (!stk[25 - c].empty()) {
                ans += i - stk[25 - c].top();
                stk[25 - c].pop();
            } else {
                stk[c].push(i);                
            }
        }
        return ans;
    }
};
