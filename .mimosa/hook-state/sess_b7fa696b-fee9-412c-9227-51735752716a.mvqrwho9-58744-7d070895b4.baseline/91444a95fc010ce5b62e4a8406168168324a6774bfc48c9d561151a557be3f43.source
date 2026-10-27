// 来源：LeetCode-Solution《移掉K位数字》
// https://leetcode.cn/problems/remove-k-digits/solutions/yi-diao-kwei-shu-zi-by-leetcode-solution/
// 小节：方法一：贪心 + 单调栈
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string removeKdigits(string num, int k) {
        vector<char> stk;
        for (auto& digit: num) {
            while (stk.size() > 0 && stk.back() > digit && k) {
                stk.pop_back();
                k -= 1;
            }
            stk.push_back(digit);
        }

        for (; k > 0; --k) {
            stk.pop_back();
        }

        string ans = "";
        bool isLeadingZero = true;
        for (auto& digit: stk) {
            if (isLeadingZero && digit == '0') {
                continue;
            }
            isLeadingZero = false;
            ans += digit;
        }
        return ans == "" ? "0" : ans;
    }
};
