// 来源：endlesscheng《跟着我过一遍示例 2，你就明白怎么做了（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/remove-duplicate-letters/solutions/gen-zhao-wo-guo-yi-bian-shi-li-2ni-jiu-m-zd6u/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string removeDuplicateLetters(string s) {
        int left[26]{};
        for (char c : s) {
            left[c - 'a']++; // 统计每个字母的出现次数
        }

        string ans; // 当作栈
        bool in_ans[26]{};
        for (char c : s) {
            left[c - 'a']--;
            if (in_ans[c - 'a']) { // ans 中不能有重复字母
                continue;
            }
            while (!ans.empty() && c < ans.back() && left[ans.back() - 'a']) {
                // (设 x=ans.back()) 如果 c < x，且右边还有 x，那么可以把 x 去掉，
                // 因为后面可以重新把 x 加到 ans 中
                in_ans[ans.back() - 'a'] = false; // 标记栈顶不在 ans 中
                ans.pop_back();
            }
            ans += c; // 把 c 加到 ans 的末尾
            in_ans[c - 'a'] = true; // 标记 c 在 ans 中
        }
        return ans;
    }
};
