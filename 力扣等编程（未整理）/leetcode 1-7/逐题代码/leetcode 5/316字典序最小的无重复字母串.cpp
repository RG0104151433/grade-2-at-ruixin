class Solution {
public:
    string removeDuplicateLetters(string s) {
        // idx[c] 表示字符 c 在"当前位置之后"还剩几个
        // 关键：在扫描到该字符时立即递减，而不是在 pop 时递减
        // 错误做法：pop 时递减 → 判断"能否弹出栈顶"时计数已经失真
        vector<int> idx(26, 0);
        for (int i = 0; i < s.size(); i++) idx[s[i]-'a']++;

        stack<int> stk;

        // in[c] 记录字符 c 是否已在栈中，防止同一字母重复压栈
        // 错误做法：不维护此数组 → 例如 "bcabc" 中 b、c 各被压入两次
        vector<bool> in(26, false);

        for (int i = 0; i < s.size(); i++) {
            idx[s[i]-'a']--;          // 扫描到时立即递减，此后 idx 代表 i 之后的剩余数量
            if (in[s[i]-'a']) continue; // 已在栈中则跳过，保证每个字母只出现一次

            // 弹出条件：栈顶字符 > 当前字符（字典序可以更优）
            //         且栈顶字符在后面还会出现（idx > 0，弹了也不会丢失）
            //
            // 易错点1：条件应为 idx > 0，而非 idx > 1
            //   idx 已在本轮开头递减，此时 idx=1 意味着后面还有1个，完全可以弹出
            //   用 >1 会漏掉"后面恰好还剩1个"的情况，导致该弹的字符没被弹出
            //
            // 易错点2：检查对象必须是栈顶字符，而非其他字符
            //   错误写法：idx[s[i-1]-'a']（检查上一个字符，且 i=0 时直接越界/UB）
            //   正确写法：idx[s[stk.top()]-'a']（检查栈顶字符后续是否还有出现）
            while (!stk.empty() && idx[s[stk.top()]-'a'] > 0 && s[stk.top()] > s[i]) {
                // 易错点3：括号位置决定了先取字符还是先做下标运算
                //   错误写法：in[s[stk.top()-'a']]  → 先算 stk.top()-'a'（下标减97），再用结果索引 s，访问随机位置
                //   正确写法：in[s[stk.top()]-'a']  → 先 s[stk.top()] 取出字符，再减 'a'
                in[s[stk.top()]-'a'] = false;
                stk.pop();
            }
            stk.push(i);
            in[s[i]-'a'] = true;
        }

        // 栈底到栈顶对应答案从左到右，弹出后需要 reverse
        string ans;
        while (!stk.empty()) {
            ans.push_back(s[stk.top()]);
            stk.pop();
        }
        reverse(ans.begin(), ans.end());
        return ans;
    }
};
