// 来源：LeetCode-Solution《Dota2 参议院》
// https://leetcode.cn/problems/dota2-senate/solutions/dota2-can-yi-yuan-by-leetcode-solution-jb7l/
// 小节：方法一：贪心 + 「循环」队列
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string predictPartyVictory(string senate) {
        int n = senate.size();
        queue<int> radiant, dire;
        for (int i = 0; i < n; ++i) {
            if (senate[i] == 'R') {
                radiant.push(i);
            }
            else {
                dire.push(i);
            }
        }
        while (!radiant.empty() && !dire.empty()) {
            if (radiant.front() < dire.front()) {
                radiant.push(radiant.front() + n);
            }
            else {
                dire.push(dire.front() + n);
            }
            radiant.pop();
            dire.pop();
        }
        return !radiant.empty() ? "Radiant" : "Dire";
    }
};
