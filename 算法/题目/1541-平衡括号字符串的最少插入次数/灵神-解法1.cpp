// 来源：endlesscheng《【套路】合法括号字符串，附相似题目（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/minimum-insertions-to-balance-a-parentheses-string/solutions/tao-lu-he-fa-gua-hao-zi-fu-chuan-fu-xian-0of7/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int minInsertions(string s) {
        int n = s.size();
        int left = 0; // 未配对的左括号个数
        int ans = 0;

        for (int i = 0; i < n; i++) {
            if (s[i] == '(') {
                left++; // 未配对的左括号
                continue;
            }

            if (left > 0) {
                left--; // 左右括号配对
            } else {
                ans++; // 右括号太多了，补一个左括号
            }

            // 必须有两个连续的右括号，也就是 s[i+1] 必须也是右括号
            if (i < n - 1 && s[i + 1] == ')') {
                i++;
            } else {
                ans++; // 补一个右括号
            }
        }

        // 左括号太多了，补上缺失的右括号
        return ans + left * 2;
    }
};
