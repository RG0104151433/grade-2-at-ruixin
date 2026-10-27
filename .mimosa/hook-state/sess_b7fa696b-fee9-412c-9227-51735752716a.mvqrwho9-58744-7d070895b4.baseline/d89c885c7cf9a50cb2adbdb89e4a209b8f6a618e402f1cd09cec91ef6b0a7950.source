// 来源：endlesscheng《邻项消除问题的套路：栈（Python/Java/C++/Go）》
// https://leetcode.cn/problems/remove-k-balanced-substrings/solutions/lin-xiang-xiao-chu-wen-ti-de-tao-lu-zhan-kb1j/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string removeSubstring(string s, int k) {
        vector<pair<char, int>> st; // 栈中保存 pair{字符, 连续出现次数}
        for (char b : s) {
            if (!st.empty() && st.back().first == b) {
                st.back().second++; // 连续相同括号个数 +1
            } else {
                st.emplace_back(b, 1); // 新的括号
            }

            // 栈顶的 k 个右括号与栈顶下面的 k 个左括号抵消
            if (b == ')' && st.size() > 1 && st.back().second == k && st[st.size() - 2].second >= k) {
                st.pop_back();
                st.back().second -= k;
                if (st.back().second == 0) {
                    st.pop_back();
                }
            }
        }

        string ans;
        for (auto& [b, cnt] : st) {
            ans += string(cnt, b);
        }
        return ans;
    }
};
