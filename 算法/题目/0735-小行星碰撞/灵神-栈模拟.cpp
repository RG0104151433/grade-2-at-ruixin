// 来源：endlesscheng《用栈维护小行星（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/asteroid-collision/solutions/yong-zhan-wei-hu-xiao-xing-xing-pythonja-llqq/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> st;
        for (int x : asteroids) {
            if (x > 0) { // x 向右
                st.push_back(x);
                continue;
            }
            bool ok = true;
            while (!st.empty() && st.back() > 0) { // 栈顶小行星向右
                int top = st.back();
                if (top <= -x) { // 栈顶小行星爆炸
                    st.pop_back();
                }
                if (top >= -x) { // x 爆炸
                    ok = false;
                    break;
                }
            }
            if (ok) { // x 没有爆炸
                st.push_back(x);
            }
        }
        return st;
    }
};
