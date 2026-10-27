// 来源：endlesscheng《三种写法：26 个栈+位运算优化（Python/Java/C++/Go）》
// https://leetcode.cn/problems/lexicographically-minimum-string-after-removing-stars/solutions/yong-26-ge-zhan-mo-ni-pythonjavacgo-by-e-mhtn/
// 小节：写法一
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    string clearStars(string s) {
        vector<int> stacks[26];
        for (int i = 0; i < s.size(); i++) {
            if (s[i] != '*') {
                stacks[s[i] - 'a'].push_back(i);
                continue;
            }
            // 找第一个非空栈，即为最小字母
            for (auto& st : stacks) {
                if (!st.empty()) {
                    st.pop_back();
                    break;
                }
            }
        }

        vector<int> idx;
        for (auto& st : stacks) {
            idx.insert(idx.end(), st.begin(), st.end());
        }
        ranges::sort(idx);

        string ans(idx.size(), 0);
        for (int i = 0; i < idx.size(); i++) {
            ans[i] = s[idx[i]];
        }
        return ans;
    }
};
