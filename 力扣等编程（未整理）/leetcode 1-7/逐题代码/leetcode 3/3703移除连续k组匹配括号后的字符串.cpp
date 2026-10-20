class Solution {
public:
    string removeSubstring(string s, int k) {
        // 用 vector 模拟栈，每个元素是 (字符, 该字符连续出现的次数)
        vector<pair<char, int>> st;

        for (char b : s) {                     // 遍历原字符串每个字符
            // 1. 更新连续计数
            if (!st.empty() && st.back().first == b) {
                st.back().second++;            // 与栈顶字符相同，计数+1
            } else {
                st.emplace_back(b, 1);         // 不同，压入新字符，计数为1
            }

            // 2. 尝试消除：当前字符是 ')' 且 栈顶恰好有 k 个 ')'，且它下面有至少 k 个 '('
            if (b == ')' && st.size() > 1 && st.back().second == k && st[st.size()-2].second >= k) {
                st.pop_back();                 // 移除这一整段 k 个 ')'
                st.back().second -= k;         // 从下面的 '(' 段中减去 k
                if (st.back().second == 0) {   // 如果 '(' 被减光了，也移除
                    st.pop_back();
                }
            }
        }

        // 3. 根据栈中剩余内容构建最终字符串
        string ans;
        for (auto& p : st) {
            ans += string(p.second, p.first);  // 重复 p.second 次字符 p.first
        }
        return ans;
    }
};
